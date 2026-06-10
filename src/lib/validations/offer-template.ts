import { z } from "zod";
import { catalogItemTypeSchema } from "./catalog";

export const offerTemplateComponentSchema = z.object({
  id: z.string().optional(),
  type: catalogItemTypeSchema,
  /** Suchbegriff als Fallback, falls keine Katalog-Verknüpfung gewählt wurde */
  keyword: z.string(),
  quantity: z.number().int().min(1, "Menge >= 1"),
  label: z.string().min(1, "Bezeichnung erforderlich"),
  order: z.number().int(),
  catalogItemId: z.string().nullable().optional(),
  catalogItemVariantId: z.string().nullable().optional(),
});

export const offerTemplateSchema = z.object({
  name: z.string().min(1, "Name erforderlich"),
  description: z.string().nullable().optional(),
  order: z.number().int(),
  active: z.boolean(),
  nennleistungKw: z
    .number()
    .positive("Leistung muss positiv sein")
    .nullable()
    .optional(),
  warmwasserSpeicherLiter: z
    .number()
    .int()
    .positive()
    .nullable()
    .optional(),
  heizkreiseAnzahl: z.number().int().min(1).max(8).nullable().optional(),
  mitSolar: z.boolean().optional(),
  components: z
    .array(offerTemplateComponentSchema)
    .min(1, "Mindestens eine Komponente"),
});

export type OfferTemplateFormData = z.infer<typeof offerTemplateSchema>;
export type OfferTemplateComponentFormData = z.infer<
  typeof offerTemplateComponentSchema
>;
