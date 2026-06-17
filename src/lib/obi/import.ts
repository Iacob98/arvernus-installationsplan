import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import {
  openObiSession,
  scrapeAllListItems,
  gotoListPage,
  openLeadDetailText,
  returnToListPage,
} from "./scraper";
import { assembleLead } from "./parse";
import {
  buildClientIndex,
  addClientToIndex,
  matchLead,
  OBI_SOURCE,
  type ClientDedupRow,
  type MatchReason,
} from "./dedup";
import type { ObiLead } from "./types";

export interface ImportOptions {
  /** Don't write to the DB — just report what would be created. */
  dryRun?: boolean;
  /** Cap how many detail pages to open this run (gentle/testing). 0 = no cap. */
  maxDetails?: number;
  /** Assign newly created clients to this user. */
  assignToId?: string | null;
  log?: (msg: string) => void;
}

export interface ImportSummary {
  total: number;
  created: number;
  skippedDuplicates: number;
  errors: number;
  /** Breakdown of why leads were skipped. */
  skipReasons: Record<MatchReason, number>;
  /** Leads that would be created (dry run only). */
  plannedLeads?: ObiLead[];
  detailsOpened: number;
  truncated: boolean;
}

const noop = () => {};

/** Inline sequential customer number (KD-YEAR-NNNN), mirroring generateCustomerNumber. */
async function nextCustomerNumber(): Promise<string> {
  const prefix = `KD-${new Date().getFullYear()}-`;
  const last = await db.client.findFirst({
    where: { customerNumber: { startsWith: prefix } },
    orderBy: { customerNumber: "desc" },
    select: { customerNumber: true },
  });
  let next = 1;
  if (last) {
    const n = parseInt(last.customerNumber.slice(prefix.length), 10);
    if (!isNaN(n)) next = n + 1;
  }
  return `${prefix}${String(next).padStart(4, "0")}`;
}

/** Create a client from an OBI lead, retrying on customer-number collisions. */
async function createClientFromLead(lead: ObiLead, assignToId?: string | null): Promise<string | null> {
  const base = {
    salutation: lead.salutation,
    firstName: lead.firstName || "-",
    lastName: lead.lastName || "-",
    email: lead.email || "",
    phone: lead.phone || "",
    street: lead.street || "-",
    houseNumber: lead.houseNumber || "-",
    postalCode: lead.postalCode || "00000",
    city: lead.city || "-",
    notes: lead.anfrage || "",
    status: "NEU" as const,
    source: OBI_SOURCE,
    externalId: lead.externalId,
    assignedToId: assignToId ?? null,
  };

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const created = await db.client.create({
        data: { customerNumber: await nextCustomerNumber(), ...base },
        select: { id: true },
      });
      return created.id;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        const target = String((e.meta?.target as string[] | string) ?? "");
        // (source, externalId) collision → already imported concurrently → skip.
        if (target.includes("externalId") || target.includes("source")) return null;
        // customerNumber collision → retry with the next number.
        continue;
      }
      throw e;
    }
  }
  throw new Error(`Could not assign a unique customer number for ${lead.externalId}`);
}

/**
 * Scrape OBI active projects and import them as clients, skipping any that
 * already exist (by externalId, email, phone, or lastName+PLZ). Existing
 * clients are never modified.
 */
export async function importObiLeads(opts: ImportOptions = {}): Promise<ImportSummary> {
  const log = opts.log ?? noop;
  const maxDetails = opts.maxDetails ?? 0;

  const summary: ImportSummary = {
    total: 0,
    created: 0,
    skippedDuplicates: 0,
    errors: 0,
    skipReasons: { externalId: 0, email: 0, phone: 0, "name+plz": 0 },
    plannedLeads: opts.dryRun ? [] : undefined,
    detailsOpened: 0,
    truncated: false,
  };

  const session = await openObiSession();
  try {
    log("Scraping active project list…");
    const items = await scrapeAllListItems(session.page);
    summary.total = items.length;
    log(`Found ${items.length} active leads.`);

    const clients = (await db.client.findMany({
      select: { id: true, email: true, phone: true, lastName: true, postalCode: true, externalId: true, source: true },
    })) as ClientDedupRow[];
    const index = buildClientIndex(clients);

    // Phase 1: quick dedup on list data (externalId / phone) — no detail page needed.
    const needDetail = items.filter((it) => {
      const m = matchLead(index, { externalId: it.externalId, phone: it.phone });
      if (m) {
        summary.skippedDuplicates++;
        summary.skipReasons[m.reason]++;
        return false;
      }
      return true;
    });
    log(`${summary.skippedDuplicates} already known (list-level). ${needDetail.length} need a detail check.`);

    // Phase 2: open details for the rest (needed for address + email-level dedup),
    // grouped by list page to minimise navigation.
    const byPage = new Map<number, typeof needDetail>();
    for (const it of needDetail) {
      const p = it.pageNum ?? 1;
      if (!byPage.has(p)) byPage.set(p, []);
      byPage.get(p)!.push(it);
    }

    outer: for (const pageNum of [...byPage.keys()].sort((a, b) => a - b)) {
      await gotoListPage(session.page, session.orgId, pageNum);
      for (const it of byPage.get(pageNum)!) {
        if (maxDetails && summary.detailsOpened >= maxDetails) {
          summary.truncated = true;
          log(`Reached maxDetails=${maxDetails}; stopping (remaining leads not checked).`);
          break outer;
        }
        try {
          const text = await openLeadDetailText(session.page, it.externalId);
          summary.detailsOpened++;
          if (!text) {
            summary.errors++;
            log(`! ${it.externalId}: detail not found`);
            await returnToListPage(session.page, session.orgId, pageNum);
            continue;
          }
          const lead = assembleLead(it, text);

          const m = matchLead(index, {
            externalId: lead.externalId,
            email: lead.email,
            phone: lead.phone,
            lastName: lead.lastName,
            postalCode: lead.postalCode,
          });
          if (m) {
            summary.skippedDuplicates++;
            summary.skipReasons[m.reason]++;
          } else if (opts.dryRun) {
            summary.plannedLeads!.push(lead);
            // record so duplicates within this run are also caught
            addClientToIndex(index, {
              id: `dry-${lead.externalId}`,
              email: lead.email,
              phone: lead.phone,
              lastName: lead.lastName,
              postalCode: lead.postalCode,
              externalId: lead.externalId,
              source: OBI_SOURCE,
            });
          } else {
            const id = await createClientFromLead(lead, opts.assignToId);
            if (id) {
              summary.created++;
              addClientToIndex(index, {
                id,
                email: lead.email,
                phone: lead.phone,
                lastName: lead.lastName,
                postalCode: lead.postalCode,
                externalId: lead.externalId,
                source: OBI_SOURCE,
              });
            } else {
              summary.skippedDuplicates++;
              summary.skipReasons.externalId++;
            }
          }
        } catch (e) {
          summary.errors++;
          log(`! ${it.externalId}: ${(e as Error).message}`);
        }
        await returnToListPage(session.page, session.orgId, pageNum);
      }
    }

    log(
      `Done. created=${summary.created} skipped=${summary.skippedDuplicates} errors=${summary.errors} ` +
        `(reasons: ${JSON.stringify(summary.skipReasons)})`,
    );
    return summary;
  } finally {
    await session.close();
  }
}
