"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requireAdmin, requireAuth } from "@/lib/auth-utils";
import { clientSchema, ClientFormData } from "@/lib/validations/client";
import { revalidatePath } from "next/cache";
import { ClientStatus, Prisma } from "@prisma/client";

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
      _count: { select: { projects: true } },
      reminders: {
        where: { completed: false },
        orderBy: { date: "asc" },
      },
      assignedTo: { select: { id: true, name: true } },
    },
  });

  // Sort: clients with overdue/today reminders first
  const now = new Date();
  now.setHours(23, 59, 59, 999);

  return clients.sort((a, b) => {
    const aHasUrgent = a.reminders.some((r) => r.date <= now);
    const bHasUrgent = b.reminders.some((r) => r.date <= now);
    if (aHasUrgent && !bHasUrgent) return -1;
    if (!aHasUrgent && bHasUrgent) return 1;
    return 0;
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

  const [total, neu, inBearbeitung, verkauft, nichtVerkauft] = await Promise.all([
    db.client.count({ where: baseWhere }),
    db.client.count({ where: { ...baseWhere, status: "NEU" } }),
    db.client.count({ where: { ...baseWhere, status: "IN_BEARBEITUNG" } }),
    db.client.count({ where: { ...baseWhere, status: "VERKAUFT" } }),
    db.client.count({ where: { ...baseWhere, status: "NICHT_VERKAUFT" } }),
  ]);

  return { total, neu, inBearbeitung, verkauft, nichtVerkauft };
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

export async function createClient(data: ClientFormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Nicht authentifiziert");

  const validated = clientSchema.parse(data);

  const client = await db.client.create({ data: validated });
  revalidatePath("/clients");
  return client;
}

export async function updateClient(id: string, data: ClientFormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Nicht authentifiziert");

  const validated = clientSchema.parse(data);

  const client = await db.client.update({ where: { id }, data: validated });
  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  return client;
}

export async function updateClientStatus(
  id: string,
  status: ClientStatus,
  substatus?: string | null,
  dealProbability?: string | null
) {
  const session = await auth();
  if (!session?.user) throw new Error("Nicht authentifiziert");

  const updateData: Record<string, unknown> = { status };

  // Clear substatus when not IN_BEARBEITUNG
  if (status !== "IN_BEARBEITUNG") {
    updateData.substatus = null;
    updateData.dealProbability = null;
  } else {
    if (substatus !== undefined) updateData.substatus = substatus;
    if (dealProbability !== undefined) updateData.dealProbability = dealProbability;
  }

  const client = await db.client.update({
    where: { id },
    data: updateData,
  });

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

export async function toggleUnsubscribe(id: string, unsubscribed: boolean) {
  const session = await auth();
  if (!session?.user) throw new Error("Nicht authentifiziert");

  await db.client.update({
    where: { id },
    data: { unsubscribed },
  });

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
