import { z } from "zod";
import { catalogItemTypeSchema, technicalDataEntrySchema } from "./catalog";

export const OFFER_DISCOUNT_KINDS = ["PERCENT", "AMOUNT", "FOERDERUNG"] as const;
export const offerDiscountKindSchema = z.enum(OFFER_DISCOUNT_KINDS);

export const offerInquirySchema = z.object({
  wohnflaecheM2: z.string().nullable().optional(),
  annualKwhGas: z.string().nullable().optional(),
  wohneinheiten: z.string().nullable().optional(),
  heizsystem: z.string().nullable().optional(),
  hotWaterIncluded: z.string().nullable().optional(),
  currentHeating: z.string().nullable().optional(),
  heatingAge: z.string().nullable().optional(),
  incomeRange: z.string().nullable().optional(),
  additionalInfo: z.string().nullable().optional(),
});

export const offerPositionSchema = z.object({
  catalogItemVariantId: z.string().nullable().optional(),
  name: z.string().min(1, "Name ist erforderlich"),
  description: z.string().nullable().optional(),
  itemType: catalogItemTypeSchema,
  manufacturer: z.string().nullable().optional(),
  photoStoragePath: z.string().nullable().optional(),
  technicalData: z.array(technicalDataEntrySchema),
  unitPrice: z.number().nonnegative(),
  quantity: z.number().int().min(1, "Menge muss >= 1 sein"),
  order: z.number().int(),
});

export const offerDiscountSchema = z.object({
  label: z.string().min(1, "Bezeichnung ist erforderlich"),
  description: z.string().nullable().optional(),
  kind: offerDiscountKindSchema,
  value: z.number().nonnegative(),
  order: z.number().int(),
});

export const kfwFoerderungSchema = z.object({
  enabled: z.boolean(),
  grundfoerderung: z.boolean(),
  einkommensbonus: z.boolean(),
  geschwindigkeitsbonus: z.boolean(),
  innovationsbonus: z.boolean(),
  foerderfaehigeKosten: z.number().nonnegative(),
});

export const heatBalanceSchema = z.object({
  enabled: z.boolean(),
  annualConsumptionKwh: z.number().nonnegative(),
  scop: z.number().positive(),
  gasPricePerKwh: z.number().nonnegative(),
  oilPricePerLiter: z.number().nonnegative(),
  electricityPricePerKwh: z.number().nonnegative(),
  pvSharePercent: z.number().min(0).max(100),
  bufferSharePercent: z.number().min(0).max(100),
  fuel: z.enum(["GAS", "OEL", "STROM"]),
  monthlyDistribution: z.array(z.number()).length(12),
});

export const createOfferSchema = z.object({
  title: z.string().min(1),
  validUntilDays: z.number().int().min(1),
  inquiry: offerInquirySchema,
  positions: z.array(offerPositionSchema).min(1, "Mindestens eine Position"),
  discounts: z.array(offerDiscountSchema),
  heatBalance: heatBalanceSchema,
  serviceItems: z.array(z.string().min(1)),
  kfwFoerderung: kfwFoerderungSchema,
});

export const sendOfferSchema = z.object({
  subject: z.string().min(1, "Betreff ist erforderlich"),
  body: z.string().min(1, "Text ist erforderlich"),
  attachPdf: z.boolean(),
});

export type CreateOfferData = z.infer<typeof createOfferSchema>;
export type SendOfferData = z.infer<typeof sendOfferSchema>;
export type OfferPositionData = z.infer<typeof offerPositionSchema>;
export type OfferDiscountData = z.infer<typeof offerDiscountSchema>;
export type OfferInquiryData = z.infer<typeof offerInquirySchema>;
