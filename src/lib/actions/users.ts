"use server";

import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireAdmin, requireAuth, generatePin } from "@/lib/auth-utils";
import { createUserSchema, updateUserSchema, CreateUserData, UpdateUserData } from "@/lib/validations/user";
import { revalidatePath } from "next/cache";

export async function getUsers() {
  await requireAdmin();
  return db.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
      _count: { select: { assignedClients: true } },
    },
  });
}

export async function getUser(id: string) {
  await requireAdmin();
  return db.user.findUnique({
    where: { id },
    include: {
      assignedClients: {
        select: { id: true, firstName: true, lastName: true, customerNumber: true },
        orderBy: { lastName: "asc" },
      },
    },
  });
}

export async function createUser(data: CreateUserData) {
  await requireAdmin();
  const validated = createUserSchema.parse(data);

  const existing = await db.user.findUnique({ where: { email: validated.email } });
  if (existing) throw new Error("E-Mail-Adresse wird bereits verwendet");

  const pin = generatePin();
  const passwordHash = await bcrypt.hash(pin, 12);

  const user = await db.user.create({
    data: {
      name: validated.name,
      email: validated.email,
      role: validated.role,
      passwordHash,
    },
  });

  revalidatePath("/users");
  return { user: { id: user.id, name: user.name, email: user.email, role: user.role }, pin };
}

export async function updateUser(id: string, data: UpdateUserData) {
  await requireAdmin();
  const validated = updateUserSchema.parse(data);

  if (validated.email) {
    const existing = await db.user.findFirst({
      where: { email: validated.email, NOT: { id } },
    });
    if (existing) throw new Error("E-Mail-Adresse wird bereits verwendet");
  }

  const user = await db.user.update({
    where: { id },
    data: validated,
  });

  revalidatePath("/users");
  return user;
}

export async function resetUserPin(id: string) {
  await requireAdmin();

  const pin = generatePin();
  const passwordHash = await bcrypt.hash(pin, 12);

  await db.user.update({
    where: { id },
    data: { passwordHash },
  });

  return { pin };
}

export async function toggleUserActive(id: string, active: boolean) {
  await requireAdmin();

  await db.user.update({
    where: { id },
    data: { active },
  });

  revalidatePath("/users");
}

export async function getActiveUsers() {
  await requireAuth();
  return db.user.findMany({
    where: { active: true },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });
}
