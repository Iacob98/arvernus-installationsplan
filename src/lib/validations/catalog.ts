import { z } from "zod";

export const CATALOG_ITEM_TYPES = [
  "WAERMEPUMPE",
  "INNENGERAET",
  "HEIZUNGSSPEICHER",
  "WARMWASSERSPEICHER",
  "ANDERE",
] as const;

export const catalogItemTypeSchema = z.enum(CATALOG_ITEM_TYPES);

export const technicalDataEntrySchema = z.object({
  key: z.string().min(1, "Schlüssel ist erforderlich"),
  value: z.string().min(1, "Wert ist erforderlich"),
});

export const catalogVariantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Bezeichnung ist erforderlich"),
  description: z.string().nullable().optional(),
  photoStoragePath: z.string().nullable().optional(),
  price: z.number().nonnegative("Preis muss >= 0 sein"),
  technicalData: z.array(technicalDataEntrySchema),
  active: z.boolean(),
  order: z.number().int(),
});

export const catalogItemSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  description: z.string().nullable().optional(),
  type: catalogItemTypeSchema,
  manufacturer: z.string().nullable().optional(),
  active: z.boolean(),
  order: z.number().int(),
  variants: z
    .array(catalogVariantSchema)
    .min(1, "Mindestens eine Variante ist erforderlich"),
});

export type CatalogItemFormData = z.infer<typeof catalogItemSchema>;
export type CatalogVariantFormData = z.infer<typeof catalogVariantSchema>;
export type TechnicalDataEntry = z.infer<typeof technicalDataEntrySchema>;
