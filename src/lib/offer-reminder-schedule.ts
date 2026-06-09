export const OFFER_REMINDER_SCHEDULE = [
  { step: 1 as const, delayDays: 2 },
  { step: 2 as const, delayDays: 5 },
  { step: 3 as const, delayDays: 6 },
  { step: 4 as const, delayDays: 10 },
] as const;

export type OfferReminderStep = (typeof OFFER_REMINDER_SCHEDULE)[number]["step"];

export const REMINDER_JOB_NAME = "send-offer-reminder";

export const reminderJobId = (offerId: string, step: number) =>
  `offer-reminder:${offerId}:${step}`;
