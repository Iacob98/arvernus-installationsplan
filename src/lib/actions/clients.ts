"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requireAdmin, requireAuth } from "@/lib/auth-utils";
import { clientSchema, ClientFormData } from "@/lib/validations/client";
import { revalidatePath } from "next/cache";
import { ClientStatus, Prisma } from "@prisma/client";
import { cancelClientOfferReminders } from "./offer-reminders";

export async function getClients(search?: string, statusFilter?: ClientStatus, assignedToFilter?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Nicht authentifiziert");

  const where: Record<string, unknown> = {};

  // Non-admin users see only their assigned clients
  if (session.user.role !== "ADMIN") {
    where.assignedToId = session.user.id;
  } else if (assignedToFilter && assignedToFilter !== "ALL") {
    // Admin filtering by user
    if (assignedToFilter === "UNASSIGNED") {
      where.assignedToId = null;
    } else {
      where.assignedToId = assignedToFilter;
    }
  }

  if (statusFilter) {
    where.status = statusFilter;
  }

  if (search) {
    where.OR = [
      { firstName: { contains: search, mode: "insensitive" as const } },
      { lastName: { contains: search, mode: "insensitive" as const } },
      { customerNumber: { contains: search, mode: "insensitive" as const } },
      { city: { contains: search, mode: "insensitive" as const } },
      { street: { contains: search, mode: "insensitive" as const } },
    ];
  }

  const clients = await db.client.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: {
          projects: true,
          callLogs: true,
          offers: true,
          emailLogs: true,
        },
      },
      reminders: {
        where: { completed: false },
        orderBy: { date: "asc" },
      },
      callLogs: {
        orderBy: { calledAt: "desc" },
        take: 1,
        select: { calledAt: true },
      },
      offers: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
      assignedTo: { select: { id: true, name: true } },
    },
  });

  // Pipeline-Sortierung: aktive Stufen oben, in jeder Stufe updatedAt DESC.
  const STATUS_ORDER: Record<ClientStatus, number> = {
    NEU: 0,
    ANGERUFEN: 1,
    ANGEBOT_VERSENDET: 2,
    IM_KONTAKT: 3,
    VERKAUFT: 4,
    NICHT_VERKAUFT: 5,
  };

  return clients.sort((a, b) => {
    const cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (cmp !== 0) return cmp;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });
}

export async function getClientCounts(assignedToFilter?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Nicht authentifiziert");

  let baseWhere: Record<string, unknown> = {};
  if (session.user.role !== "ADMIN") {
    baseWhere = { assignedToId: session.user.id };
  } else if (assignedToFilter && assignedToFilter !== "ALL") {
    if (assignedToFilter === "UNASSIGNED") {
      baseWhere = { assignedToId: null };
    } else {
      baseWhere = { assignedToId: assignedToFilter };
    }
  }

  const [
    total,
    neu,
    angerufen,
    angebotVersendet,
    imKontakt,
    verkauft,
    nichtVerkauft,
  ] = await Promise.all([
    db.client.count({ where: baseWhere }),
    db.client.count({ where: { ...baseWhere, status: "NEU" } }),
    db.client.count({ where: { ...baseWhere, status: "ANGERUFEN" } }),
    db.client.count({ where: { ...baseWhere, status: "ANGEBOT_VERSENDET" } }),
    db.client.count({ where: { ...baseWhere, status: "IM_KONTAKT" } }),
    db.client.count({ where: { ...baseWhere, status: "VERKAUFT" } }),
    db.client.count({ where: { ...baseWhere, status: "NICHT_VERKAUFT" } }),
  ]);

  return {
    total,
    neu,
    angerufen,
    angebotVersendet,
    imKontakt,
    verkauft,
    nichtVerkauft,
  };
}

const clientDetailInclude = {
  projects: {
    orderBy: { updatedAt: "desc" as const },
    include: { createdBy: { select: { name: true } } },
  },
  reminders: {
    orderBy: { date: "asc" as const },
  },
  emailLogs: {
    orderBy: { createdAt: "desc" as const },
    take: 20,
    include: { sentBy: { select: { name: true } } },
  },
  clientNotes: {
    orderBy: { createdAt: "desc" as const },
    take: 50,
    include: { author: { select: { name: true } } },
  },
  attachments: {
    orderBy: { createdAt: "desc" as const },
    include: { uploadedBy: { select: { name: true } } },
  },
  offers: {
    orderBy: { createdAt: "desc" as const },
    take: 20,
    include: { createdBy: { select: { name: true } } },
  },
  callLogs: {
    orderBy: { calledAt: "desc" as const },
    take: 30,
    include: { user: { select: { name: true } } },
  },
  assignedTo: { select: { id: true, name: true } },
} satisfies Prisma.ClientInclude;

export type ClientDetail = Prisma.ClientGetPayload<{ include: typeof clientDetailInclude }>;

export async function getClient(id: string): Promise<ClientDetail | null> {
  const session = await auth();
  if (!session?.user) throw new Error("Nicht authentifiziert");

  const client = await db.client.findUnique({
    where: { id },
    include: clientDetailInclude,
  });

  if (!client) return null;

  // Non-admin can only see their own assigned clients
  if (session.user.role !== "ADMIN" && client.assignedToId !== session.user.id) {
    return null;
  }

  return client;
}

/**
 * Erzeugt eine sequentielle Kundennummer im Format KD-JAHR-NNNN.
 * Pro Jahr beginnt der Zähler bei 0001.
 */
export async function generateCustomerNumber(year?: number): Promise<string> {
  const y = year ?? new Date().getFullYear();
  const prefix = `KD-${y}-`;
  const last = await db.client.findFirst({
    where: { customerNumber: { startsWith: prefix } },
    orderBy: { customerNumber: "desc" },
    select: { customerNumber: true },
  });
  let next = 1;
  if (last) {
    const num = parseInt(last.customerNumber.slice(prefix.length), 10);
    if (!isNaN(num)) next = num + 1;
  }
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export async function createClient(data: ClientFormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Nicht authentifiziert");

  const validated = clientSchema.parse(data);

  // Bei Kollision die nächste freie Nummer wählen (mit kleinen Retries).
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const client = await db.client.create({ data: validated });
      revalidatePath("/clients");
      return client;
    } catch (e) {
      const isUniqueConflict =
        e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
      if (!isUniqueConflict) throw e;
      // Vergib neue sequenzielle Nummer und versuche es erneut.
      validated.customerNumber = await generateCustomerNumber();
    }
  }
  throw new Error("Konnte keine eindeutige Kundennummer vergeben");
}

export async function updateClient(id: string, data: ClientFormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Nicht authentifiziert");

  const validated = clientSchema.parse(data);

  const before = await db.client.findUnique({
    where: { id },
    select: { status: true },
  });

  const client = await db.client.update({ where: { id }, data: validated });

  if (
    before &&
    before.status !== client.status &&
    (client.status === "IM_KONTAKT" ||
      client.status === "VERKAUFT" ||
      client.status === "NICHT_VERKAUFT")
  ) {
    await cancelClientOfferReminders(id);
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  return client;
}

export async function markClientImKontakt(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Nicht authentifiziert");

  const sentOfferCount = await db.offer.count({
    where: { clientId: id, status: "SENT" },
  });
  if (sentOfferCount === 0) {
    throw new Error("Kein gesendetes Angebot vorhanden");
  }

  const client = await db.client.update({
    where: { id },
    data: { status: "IM_KONTAKT" },
  });

  await cancelClientOfferReminders(id);

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  return client;
}

export async function deleteClient(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Nicht authentifiziert");

  const projectCount = await db.project.count({ where: { clientId: id } });
  if (projectCount > 0) {
    throw new Error("Kunde hat zugeordnete Projekte und kann nicht gelöscht werden");
  }

  await db.client.delete({ where: { id } });
  revalidatePath("/clients");
}

export async function updateClientNotes(id: string, notes: string) {
  await requireAuth();
  await db.client.update({
    where: { id },
    data: { notes: notes.trim() || null },
  });
  revalidatePath(`/clients/${id}`);
}

export async function toggleUnsubscribe(id: string, unsubscribed: boolean) {
  const session = await auth();
  if (!session?.user) throw new Error("Nicht authentifiziert");

  await db.client.update({
    where: { id },
    data: { unsubscribed },
  });

  if (unsubscribed) {
    await cancelClientOfferReminders(id);
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
}

export async function assignClient(clientId: string, userId: string | null) {
  await requireAdmin();

  await db.client.update({
    where: { id: clientId },
    data: { assignedToId: userId },
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
}

export async function bulkAssignClients(clientIds: string[], userId: string | null) {
  await requireAdmin();

  await db.client.updateMany({
    where: { id: { in: clientIds } },
    data: { assignedToId: userId },
  });

  revalidatePath("/clients");
}

const inquiryFieldKeys = [
  "ownership",
  "buildingType",
  "constructionYear",
  "householdSize",
  "currentHeating",
  "currentFuel",
  "heatingAge",
  "hotWaterIncluded",
  "timeframe",
  "availability",
  "annualKwhGas",
  "annualLitersOil",
  "additionalInfo",
  "wohnflaecheM2",
  "wohneinheiten",
  "heizsystem",
  "incomeRange",
] as const;

type InquiryPatch = Partial<Record<(typeof inquiryFieldKeys)[number], string | null>>;

export async function updateClientInquiry(clientId: string, data: InquiryPatch) {
  await requireAuth();

  const patch: Record<string, string | null> = {};
  for (const key of inquiryFieldKeys) {
    if (key in data) {
      const v = data[key];
      patch[key] = v && v.trim().length > 0 ? v.trim() : null;
    }
  }
  if (Object.keys(patch).length === 0) return;

  await db.client.update({ where: { id: clientId }, data: patch });
  revalidatePath(`/clients/${clientId}`);
}

export async function createClientNote(clientId: string, content: string) {
  const session = await requireAuth();

  if (!content.trim()) throw new Error("Notiz darf nicht leer sein");

  const note = await db.clientNote.create({
    data: {
      content: content.trim(),
      clientId,
      authorId: session.user.id,
    },
  });

  revalidatePath(`/clients/${clientId}`);
  return note;
}
