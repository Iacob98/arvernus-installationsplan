import type { CatalogItemForClient } from "@/lib/actions/catalog";
import type { CatalogItemType } from "@prisma/client";

export type TemplateComponent = {
  type: CatalogItemType;
  keyword: string;
  quantity: number;
  label: string;
  catalogItemId?: string | null;
  catalogItemVariantId?: string | null;
};

export type OfferTemplate = {
  id: string;
  label: string;
  description: string;
  components: TemplateComponent[];
  /** Strukturierte Spec für automatisches Matching im Wizard. */
  nennleistungKw?: number | null;
  warmwasserSpeicherLiter?: number | null;
  heizkreiseAnzahl?: number | null;
  mitSolar?: boolean;
};

/**
 * Adapter: DB-модель OfferTemplate → старая структура OfferTemplate из этого файла.
 * Позволяет переиспользовать resolveTemplate без изменений.
 */
export function dbTemplateToOfferTemplate(t: {
  id: string;
  name: string;
  description: string | null;
  nennleistungKw?: number | null;
  warmwasserSpeicherLiter?: number | null;
  heizkreiseAnzahl?: number | null;
  mitSolar?: boolean;
  components: {
    type: CatalogItemType;
    keyword: string;
    quantity: number;
    label: string;
    catalogItemId?: string | null;
    catalogItemVariantId?: string | null;
  }[];
}): OfferTemplate {
  return {
    id: t.id,
    label: t.name,
    description: t.description ?? "",
    nennleistungKw: t.nennleistungKw ?? null,
    warmwasserSpeicherLiter: t.warmwasserSpeicherLiter ?? null,
    heizkreiseAnzahl: t.heizkreiseAnzahl ?? null,
    mitSolar: t.mitSolar ?? false,
    components: t.components.map((c) => ({
      type: c.type,
      keyword: c.keyword,
      quantity: c.quantity,
      label: c.label,
      catalogItemId: c.catalogItemId ?? null,
      catalogItemVariantId: c.catalogItemVariantId ?? null,
    })),
  };
}

/**
 * Build the target spec from inquiry + recommended kW. Used to find the
 * best-matching template on Step 1 of the offer wizard.
 */
export type TemplateMatchSpec = {
  kw: number | null;
  warmwasserLiter: number | null;
  heizkreise: number;
  solar: boolean;
};

export function buildTemplateMatchSpec(args: {
  recommendedKw: number | null;
  hotWaterIncluded: string | null | undefined;
  warmwasserSpeicherLiter: string | null | undefined;
  heizsystem: string | null | undefined;
  solarthermieVorhanden: string | null | undefined;
}): TemplateMatchSpec {
  const isKombi = (args.heizsystem ?? "").toLowerCase().includes("kombination");
  const ww =
    args.hotWaterIncluded === "Ja" && args.warmwasserSpeicherLiter
      ? Number(args.warmwasserSpeicherLiter) || null
      : null;
  return {
    kw: args.recommendedKw,
    warmwasserLiter: ww,
    heizkreise: isKombi ? 2 : 1,
    solar: args.solarthermieVorhanden === "Ja",
  };
}

/**
 * Compare a template against the target spec. Returns:
 *  - exact:    all 4 axes match (kW within ±1 kW tolerance)
 *  - близко:   ≥ 3 axes match — template is shown but as fallback
 *  - far:      anything else
 */
export type TemplateMatchKind = "exact" | "partial" | "far";

export function matchTemplate(
  tpl: OfferTemplate,
  spec: TemplateMatchSpec,
): TemplateMatchKind {
  let hits = 0;
  let total = 0;

  // kW
  if (spec.kw != null && tpl.nennleistungKw != null) {
    total += 1;
    if (Math.abs(tpl.nennleistungKw - spec.kw) <= 1) hits += 1;
  }

  // Warmwasser-Speicher
  if (spec.warmwasserLiter != null) {
    total += 1;
    if (tpl.warmwasserSpeicherLiter === spec.warmwasserLiter) hits += 1;
  } else {
    total += 1;
    if (
      tpl.warmwasserSpeicherLiter == null ||
      tpl.warmwasserSpeicherLiter === 0
    ) {
      hits += 1;
    }
  }

  // Heizkreise (1 = Standard, 2 = Kombination)
  total += 1;
  const tplHk = tpl.heizkreiseAnzahl ?? 1;
  if (tplHk === spec.heizkreise) hits += 1;

  // Solar
  total += 1;
  if ((tpl.mitSolar ?? false) === spec.solar) hits += 1;

  if (total === 0) return "far";
  if (hits === total) return "exact";
  if (hits >= total - 1) return "partial";
  return "far";
}

/**
 * Готовые конфигурации Angebote под типичные дома.
 * Подбирают варианты из каталога по типу + ключевому слову в названии.
 */
export const OFFER_TEMPLATES: OfferTemplate[] = [
  {
    id: "efh-standard-12",
    label: "EFH 120–160 m² · Standard",
    description: "WP 12 kW + 200 L Warmwasser + Pufferspeicher + Hydraulik",
    components: [
      { type: "WAERMEPUMPE", keyword: "12", quantity: 1, label: "Außeneinheit 12 kW" },
      { type: "INNENGERAET", keyword: "12", quantity: 1, label: "Inneneinheit 12 kW" },
      { type: "HEIZUNGSSPEICHER", keyword: "200", quantity: 1, label: "Pufferspeicher 200 L" },
      { type: "WARMWASSERSPEICHER", keyword: "200", quantity: 1, label: "Warmwasserspeicher 200 L" },
      { type: "ANDERE", keyword: "10 Kreise", quantity: 1, label: "Heizkreisverteiler 10 Kreise" },
      { type: "ANDERE", keyword: "Heizkreispumpengruppe", quantity: 1, label: "Heizkreispumpengruppe" },
      { type: "ANDERE", keyword: "Füllpatrone", quantity: 1, label: "VDE Füllpatrone" },
      { type: "ANDERE", keyword: "Zählerschrank", quantity: 1, label: "Umbau Zählerschrank" },
    ],
  },
  {
    id: "efh-premium-16",
    label: "EFH 160–220 m² · Premium",
    description: "WP 16 kW + 290 L Warmwasser + großer Pufferspeicher",
    components: [
      { type: "WAERMEPUMPE", keyword: "16", quantity: 1, label: "Außeneinheit 16 kW" },
      { type: "INNENGERAET", keyword: "16", quantity: 1, label: "Inneneinheit 16 kW" },
      { type: "HEIZUNGSSPEICHER", keyword: "300", quantity: 1, label: "Pufferspeicher 300 L" },
      { type: "WARMWASSERSPEICHER", keyword: "290", quantity: 1, label: "Warmwasserspeicher 290 L" },
      { type: "ANDERE", keyword: "12 Kreise", quantity: 1, label: "Heizkreisverteiler 12 Kreise" },
      { type: "ANDERE", keyword: "Heizkreispumpengruppe", quantity: 2, label: "Heizkreispumpengruppen" },
      { type: "ANDERE", keyword: "Füllpatrone", quantity: 1, label: "VDE Füllpatrone" },
      { type: "ANDERE", keyword: "Zählerschrank", quantity: 1, label: "Umbau Zählerschrank" },
    ],
  },
  {
    id: "kompakt-8",
    label: "Kompakt bis 120 m² · 8 kW",
    description: "Sanierung kleinerer EFH oder gut gedämmter Neubau",
    components: [
      { type: "WAERMEPUMPE", keyword: "8", quantity: 1, label: "Außeneinheit 8 kW" },
      { type: "INNENGERAET", keyword: "8", quantity: 1, label: "Inneneinheit 8 kW" },
      { type: "HEIZUNGSSPEICHER", keyword: "120", quantity: 1, label: "Pufferspeicher 120 L" },
      { type: "WARMWASSERSPEICHER", keyword: "200", quantity: 1, label: "Warmwasserspeicher 200 L" },
      { type: "ANDERE", keyword: "6 Kreise", quantity: 1, label: "Heizkreisverteiler 6 Kreise" },
      { type: "ANDERE", keyword: "Heizkreispumpengruppe", quantity: 1, label: "Heizkreispumpengruppe" },
      { type: "ANDERE", keyword: "Füllpatrone", quantity: 1, label: "VDE Füllpatrone" },
      { type: "ANDERE", keyword: "Zählerschrank", quantity: 1, label: "Umbau Zählerschrank" },
    ],
  },
];

export type TemplateMatch = {
  itemId: string;
  variantId: string;
  catalogItem: CatalogItemForClient;
  variant: CatalogItemForClient["variants"][number];
  quantity: number;
  label: string;
};

export function resolveTemplate(
  template: OfferTemplate,
  catalog: CatalogItemForClient[],
): { matches: TemplateMatch[]; missing: TemplateComponent[] } {
  const matches: TemplateMatch[] = [];
  const missing: TemplateComponent[] = [];

  for (const comp of template.components) {
    let found: { item: CatalogItemForClient; variant: CatalogItemForClient["variants"][number] } | null = null;

    // 1) Direkter Variant-Verweis
    if (comp.catalogItemVariantId) {
      for (const item of catalog) {
        const variant = item.variants.find(
          (v) => v.id === comp.catalogItemVariantId,
        );
        if (variant) {
          found = { item, variant };
          break;
        }
      }
    }

    // 2) Item-Verweis → erster aktiver Variant
    if (!found && comp.catalogItemId) {
      const item = catalog.find((c) => c.id === comp.catalogItemId);
      const variant = item?.variants[0];
      if (item && variant) found = { item, variant };
    }

    // 3) Fallback: Typ + Suchbegriff im Variantennamen
    if (!found && comp.keyword) {
      const itemsOfType = catalog.filter((c) => c.type === comp.type);
      const kwLower = comp.keyword.toLowerCase();
      for (const item of itemsOfType) {
        const variantHit = item.variants.find(
          (v) =>
            v.name.toLowerCase().includes(kwLower) ||
            item.name.toLowerCase().includes(kwLower),
        );
        if (variantHit) {
          found = { item, variant: variantHit };
          break;
        }
      }
    }

    if (found) {
      matches.push({
        itemId: found.item.id,
        variantId: found.variant.id,
        catalogItem: found.item,
        variant: found.variant,
        quantity: comp.quantity,
        label: comp.label,
      });
    } else {
      missing.push(comp);
    }
  }

  return { matches, missing };
}
