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
  status: z
    .enum([
      "NEU",
      "ANGERUFEN",
      "ANGEBOT_VERSENDET",
      "IM_KONTAKT",
      "VERKAUFT",
      "NICHT_VERKAUFT",
    ])
    .optional(),
  source: z.string().nullable().optional(),
  assignedToId: z.string().nullable().optional(),
  ownership: z.string().nullable().optional(),
  buildingType: z.string().nullable().optional(),
  constructionYear: z.string().nullable().optional(),
  householdSize: z.string().nullable().optional(),
  currentHeating: z.string().nullable().optional(),
  currentFuel: z.string().nullable().optional(),
  heatingAge: z.string().nullable().optional(),
  hotWaterIncluded: z.string().nullable().optional(),
  timeframe: z.string().nullable().optional(),
  availability: z.string().nullable().optional(),
  annualKwhGas: z.string().nullable().optional(),
  annualLitersOil: z.string().nullable().optional(),
  additionalInfo: z.string().nullable().optional(),
});

export type ClientFormData = z.infer<typeof clientSchema>;
