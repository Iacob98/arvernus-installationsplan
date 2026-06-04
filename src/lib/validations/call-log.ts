import { z } from "zod";

export const CALL_OUTCOMES = ["REACHED", "NOT_REACHED", "VOICEMAIL", "BUSY"] as const;
export const callOutcomeSchema = z.enum(CALL_OUTCOMES);

export const createCallLogSchema = z
  .object({
    calledAt: z.coerce.date(),
    outcome: callOutcomeSchema,
    notes: z.string().nullable().optional(),
    nextCallAt: z.coerce.date().nullable().optional(),
  })
  .refine((d) => d.outcome === "REACHED" || d.nextCallAt, {
    message: "Rückruf-Termin ist erforderlich, wenn nicht erreicht",
    path: ["nextCallAt"],
  });

export type CreateCallLogData = z.infer<typeof createCallLogSchema>;

export const CALL_OUTCOME_LABELS: Record<(typeof CALL_OUTCOMES)[number], string> = {
  REACHED: "Erreicht",
  NOT_REACHED: "Nicht erreicht",
  VOICEMAIL: "Mailbox",
  BUSY: "Besetzt",
};
