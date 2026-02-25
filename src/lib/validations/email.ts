import { z } from "zod";

export const emailSchema = z.object({
  subject: z.string().min(1, "Betreff ist erforderlich"),
  body: z.string().min(1, "Nachricht ist erforderlich"),
});

export type EmailFormData = z.infer<typeof emailSchema>;
