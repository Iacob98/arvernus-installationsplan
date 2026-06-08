"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import {
  createCallLogSchema,
  CreateCallLogData,
} from "@/lib/validations/call-log";
import { revalidatePath } from "next/cache";

export async function createCallLog(clientId: string, data: CreateCallLogData) {
  const session = await requireAuth();
  const validated = createCallLogSchema.parse(data);

  const client = await db.client.findUnique({
    where: { id: clientId },
    select: { id: true, firstName: true, lastName: true },
  });
  if (!client) throw new Error("Kunde nicht gefunden");

  const callLog = await db.$transaction(async (tx) => {
    let reminderId: string | null = null;

    if (validated.nextCallAt) {
      const defaultDesc =
        validated.outcome === "REACHED"
          ? `Erinnerung · ${client.firstName} ${client.lastName}`.trim()
          : `Rückruf · ${client.firstName} ${client.lastName}`.trim();
      const reminder = await tx.reminder.create({
        data: {
          clientId,
          date: validated.nextCallAt,
          description:
            validated.reminderDescription?.trim() || defaultDesc,
          completed: false,
        },
      });
      reminderId = reminder.id;
    }

    // Auto-advance pipeline: erster erfolgreicher Anruf hebt NEU/IN_BEARBEITUNG auf ANGERUFEN
    if (validated.outcome === "REACHED") {
      const current = await tx.client.findUnique({
        where: { id: clientId },
        select: { status: true },
      });
      if (
        current &&
        (current.status === "NEU" || current.status === "IN_BEARBEITUNG")
      ) {
        await tx.client.update({
          where: { id: clientId },
          data: { status: "ANGERUFEN" },
        });
      }
    }

    return tx.callLog.create({
      data: {
        clientId,
        userId: session.user.id,
        calledAt: validated.calledAt,
        outcome: validated.outcome,
        notes: validated.notes?.trim() || null,
        nextCallAt: validated.nextCallAt ?? null,
        reminderId,
      },
    });
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  return { id: callLog.id };
}

export async function deleteCallLog(callLogId: string) {
  const session = await requireAuth();
  const log = await db.callLog.findUnique({
    where: { id: callLogId },
    select: { id: true, clientId: true, userId: true, reminderId: true },
  });
  if (!log) throw new Error("Anruf nicht gefunden");
  if (log.userId !== session.user.id && session.user.role !== "ADMIN") {
    throw new Error("Keine Berechtigung");
  }

  await db.$transaction(async (tx) => {
    await tx.callLog.delete({ where: { id: callLogId } });
    if (log.reminderId) {
      const reminder = await tx.reminder.findUnique({
        where: { id: log.reminderId },
        select: { completed: true },
      });
      if (reminder && !reminder.completed) {
        await tx.reminder.delete({ where: { id: log.reminderId } });
      }
    }
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${log.clientId}`);
}
