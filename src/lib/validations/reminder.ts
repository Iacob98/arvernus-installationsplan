import { z } from "zod";

export const reminderSchema = z.object({
  date: z.coerce.date({ message: "Datum ist erforderlich" }),
  description: z.string().min(1, "Beschreibung ist erforderlich"),
});

export type ReminderFormData = z.infer<typeof reminderSchema>;
