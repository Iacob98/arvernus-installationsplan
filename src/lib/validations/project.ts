import { z } from "zod";

export const projectSchema = z.object({
  projectNumber: z.string().min(1, "Projektnummer ist erforderlich"),
  title: z.string().min(1, "Titel ist erforderlich"),
  clientId: z.string().min(1, "Kunde ist erforderlich"),
  street: z.string().min(1, "Straße ist erforderlich"),
  houseNumber: z.string().min(1, "Hausnummer ist erforderlich"),
  postalCode: z.string().min(4, "PLZ ist erforderlich"),
  city: z.string().min(1, "Stadt ist erforderlich"),
  installationDate: z.string().optional(),
  notes: z.string().optional(),
});

export type ProjectFormData = z.infer<typeof projectSchema>;
