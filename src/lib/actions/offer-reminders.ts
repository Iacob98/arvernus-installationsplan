"use server";

import { db } from "@/lib/db";
import {
  OFFER_REMINDER_SCHEDULE,
  reminderJobId,
} from "@/lib/offer-reminder-schedule";
import {
  scheduleOfferReminderJob,
  removeOfferReminderJob,
} from "@/lib/queue";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Plant alle Erinnerungen für ein Angebot. Idempotent — bestehende SCHEDULED
 * werden zuerst abgebrochen. Vergangene Schritte werden übersprungen.
 */
export async function scheduleOfferReminders(offerId: string) {
  const offer = await db.offer.findUnique({
    where: { id: offerId },
    select: {
      sentAt: true,
      client: { select: { email: true, unsubscribed: true } },
    },
  });
  if (!offer?.sentAt) return;
  if (!offer.client.email || offer.client.unsubscribed) return;

  await cancelOfferReminders(offerId);

  const baseMs = offer.sentAt.getTime();
  const now = Date.now();

  for (const step of OFFER_REMINDER_SCHEDULE) {
    const scheduledAt = new Date(baseMs + step.delayDays * DAY_MS);
    const delayMs = scheduledAt.getTime() - now;
    if (delayMs <= 0) continue;

    const jobId = reminderJobId(offerId, step.step);
    const reminder = await db.offerReminder.create({
      data: {
        offerId,
        step: step.step,
        scheduledAt,
        status: "SCHEDULED",
        jobId,
      },
    });
    await scheduleOfferReminderJob(reminder.id, jobId, delayMs);
  }
}

/**
 * Bricht alle noch nicht gesendeten Reminders eines Offers ab.
 * Idempotent. SENT-Reminders werden nicht angefasst.
 */
export async function cancelOfferReminders(offerId: string) {
  const reminders = await db.offerReminder.findMany({
    where: { offerId, status: "SCHEDULED" },
    select: { id: true, jobId: true },
  });
  for (const r of reminders) {
    if (r.jobId) {
      await removeOfferReminderJob(r.jobId).catch(() => {});
    }
  }
  if (reminders.length > 0) {
    await db.offerReminder.updateMany({
      where: { id: { in: reminders.map((r) => r.id) } },
      data: { status: "CANCELLED" },
    });
  }
}

/**
 * Bricht Reminders aller Offers eines Clients ab. Aufruf bei
 * client.status → VERKAUFT/NICHT_VERKAUFT oder unsubscribe.
 */
export async function cancelClientOfferReminders(clientId: string) {
  const offers = await db.offer.findMany({
    where: { clientId },
    select: { id: true },
  });
  for (const o of offers) {
    await cancelOfferReminders(o.id);
  }
}
