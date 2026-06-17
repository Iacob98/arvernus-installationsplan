/**
 * Deduplication for OBI lead imports.
 *
 * Two layers:
 *  1. externalId — future imports are O(1): once a lead is imported we store its
 *     OBI code in Client.externalId (source = "obi"), so it's never re-created.
 *  2. Fuzzy match for LEGACY clients entered manually before externalId existed:
 *     email OR phone OR (lastName + postalCode). Per the product decision a match
 *     means "skip, don't touch the existing client".
 *
 * The matcher works over an in-memory index built once per import run, so 100+
 * leads dedup without per-lead DB round-trips and the logic is unit-testable.
 */

export const OBI_SOURCE = "obi";

/** Minimal client fields needed to dedup. */
export interface ClientDedupRow {
  id: string;
  email: string | null;
  phone: string | null;
  lastName: string | null;
  postalCode: string | null;
  externalId: string | null;
  source: string | null;
}

/** A lead candidate to match. Any field may be empty (list-only leads lack email/PLZ). */
export interface LeadKey {
  externalId?: string | null;
  email?: string | null;
  phone?: string | null;
  lastName?: string | null;
  postalCode?: string | null;
}

export function normalizeEmail(email: string | null | undefined): string {
  return (email || "").trim().toLowerCase();
}

/**
 * Canonicalise a German phone number for comparison: digits only, strip the
 * "00"/"+49" country code and the national trunk "0", so all of
 * "+49 157 8099 7381", "0157 80997381" and "15780997381" collapse to "15780997381".
 */
export function canonicalPhone(phone: string | null | undefined): string {
  let d = (phone || "").replace(/\D+/g, "");
  if (!d) return "";
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("49") && d.length >= 11) d = d.slice(2);
  d = d.replace(/^0+/, "");
  return d;
}

function nameKey(lastName: string | null | undefined, postalCode: string | null | undefined): string {
  const ln = (lastName || "").trim().toLowerCase();
  const plz = (postalCode || "").trim();
  if (!ln || !plz) return "";
  return `${ln}::${plz}`;
}

export interface ClientIndex {
  byExternal: Map<string, string>;
  byEmail: Map<string, string>;
  byPhone: Map<string, string>;
  byNamePlz: Map<string, string>;
}

/** Add a single client row to an existing index (first writer wins per key). */
export function addClientToIndex(idx: ClientIndex, r: ClientDedupRow): void {
  if (r.source === OBI_SOURCE && r.externalId && !idx.byExternal.has(r.externalId)) {
    idx.byExternal.set(r.externalId, r.id);
  }
  const e = normalizeEmail(r.email);
  if (e && !idx.byEmail.has(e)) idx.byEmail.set(e, r.id);
  const p = canonicalPhone(r.phone);
  if (p && !idx.byPhone.has(p)) idx.byPhone.set(p, r.id);
  const nk = nameKey(r.lastName, r.postalCode);
  if (nk && !idx.byNamePlz.has(nk)) idx.byNamePlz.set(nk, r.id);
}

export function buildClientIndex(rows: ClientDedupRow[]): ClientIndex {
  const idx: ClientIndex = {
    byExternal: new Map(),
    byEmail: new Map(),
    byPhone: new Map(),
    byNamePlz: new Map(),
  };
  for (const r of rows) addClientToIndex(idx, r);
  return idx;
}

export type MatchReason = "externalId" | "email" | "phone" | "name+plz";

export interface MatchResult {
  clientId: string;
  reason: MatchReason;
}

/**
 * Find an existing client that this lead duplicates, or null. Checks the
 * strongest signal first. `name+plz` only fires when both are present.
 */
export function matchLead(index: ClientIndex, lead: LeadKey): MatchResult | null {
  if (lead.externalId) {
    const hit = index.byExternal.get(lead.externalId);
    if (hit) return { clientId: hit, reason: "externalId" };
  }
  const e = normalizeEmail(lead.email);
  if (e) {
    const hit = index.byEmail.get(e);
    if (hit) return { clientId: hit, reason: "email" };
  }
  const p = canonicalPhone(lead.phone);
  if (p) {
    const hit = index.byPhone.get(p);
    if (hit) return { clientId: hit, reason: "phone" };
  }
  const nk = nameKey(lead.lastName, lead.postalCode);
  if (nk) {
    const hit = index.byNamePlz.get(nk);
    if (hit) return { clientId: hit, reason: "name+plz" };
  }
  return null;
}
