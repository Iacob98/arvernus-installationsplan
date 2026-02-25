import { z } from "zod";

export const clientSchema = z.object({
  customerNumber: z.string().min(1, "Kundennummer ist erforderlich"),
  salutation: z.string().optional(),
  firstName: z.string().min(1, "Vorname ist erforderlich"),
  lastName: z.string().min(1, "Nachname ist erforderlich"),
  email: z.string().email("Ungültige E-Mail").optional().or(z.literal("")),
  phone: z.string().optional(),
  street: z.string().min(1, "Straße ist erforderlich"),
  houseNumber: z.string().min(1, "Hausnummer ist erforderlich"),
  postalCode: z.string().min(4, "PLZ ist erforderlich"),
  city: z.string().min(1, "Stadt ist erforderlich"),
  notes: z.string().optional(),
  status: z.enum(["IN_BEARBEITUNG", "VERKAUFT", "NICHT_VERKAUFT"]).optional(),
  substatus: z.enum(["IN_KONTAKT", "ANGEBOT_VERSENDET", "NICHT_ERREICHBAR"]).nullable().optional(),
  dealProbability: z.enum(["NIEDRIG", "MITTEL", "HOCH"]).nullable().optional(),
  source: z.string().nullable().optional(),
});

export type ClientFormData = z.infer<typeof clientSchema>;
