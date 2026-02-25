"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { reminderSchema, ReminderFormData } from "@/lib/validations/reminder";
import { revalidatePath } from "next/cache";

export async function createReminder(clientId: string, data: ReminderFormData) {
  const session = await auth();
  if (!session?.user) throw new Error("Nicht authentifiziert");

  const validated = reminderSchema.parse(data);

  const reminder = await db.reminder.create({
    data: {
      ...validated,
      clientId,
    },
  });

  revalidatePath(`/clients/${clientId}`);
  revalidatePath("/clients");
  return reminder;
}

export async function toggleReminder(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Nicht authentifiziert");

  const reminder = await db.reminder.findUnique({ where: { id } });
  if (!reminder) throw new Error("Erinnerung nicht gefunden");

  const updated = await db.reminder.update({
    where: { id },
    data: { completed: !reminder.completed },
  });

  revalidatePath(`/clients/${reminder.clientId}`);
  revalidatePath("/clients");
  return updated;
}

export async function deleteReminder(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Nicht authentifiziert");

  const reminder = await db.reminder.findUnique({ where: { id } });
  if (!reminder) throw new Error("Erinnerung nicht gefunden");

  await db.reminder.delete({ where: { id } });

  revalidatePath(`/clients/${reminder.clientId}`);
  revalidatePath("/clients");
}
