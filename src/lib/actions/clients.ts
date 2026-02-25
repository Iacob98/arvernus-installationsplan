"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { clientSchema, ClientFormData } from "@/lib/validations/client";
import { revalidatePath } from "next/cache";
import { ClientStatus } from "@prisma/client";

export async function getClients(search?: string, statusFilter?: ClientStatus) {
  const where: Record<string, unknown> = {};

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

export async function getClientCounts() {
  const [total, inBearbeitung, verkauft, nichtVerkauft] = await Promise.all([
    db.client.count(),
    db.client.count({ where: { status: "IN_BEARBEITUNG" } }),
    db.client.count({ where: { status: "VERKAUFT" } }),
    db.client.count({ where: { status: "NICHT_VERKAUFT" } }),
  ]);

  return { total, inBearbeitung, verkauft, nichtVerkauft };
}

export async function getClient(id: string) {
  return db.client.findUnique({
    where: { id },
    include: {
      projects: {
        orderBy: { updatedAt: "desc" },
        include: { createdBy: { select: { name: true } } },
      },
      reminders: {
        orderBy: { date: "asc" },
      },
      emailLogs: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { sentBy: { select: { name: true } } },
      },
    },
  });
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
