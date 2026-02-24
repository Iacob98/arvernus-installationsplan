"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { clientSchema, ClientFormData } from "@/lib/validations/client";
import { revalidatePath } from "next/cache";

export async function getClients(search?: string) {
  const where = search
    ? {
        OR: [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
          { customerNumber: { contains: search, mode: "insensitive" as const } },
          { city: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  return db.client.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    include: { _count: { select: { projects: true } } },
  });
}

export async function getClient(id: string) {
  return db.client.findUnique({
    where: { id },
    include: {
      projects: {
        orderBy: { updatedAt: "desc" },
        include: { createdBy: { select: { name: true } } },
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
