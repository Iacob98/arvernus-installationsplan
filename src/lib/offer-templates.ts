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
};

/**
 * Adapter: DB-модель OfferTemplate → старая структура OfferTemplate из этого файла.
 * Позволяет переиспользовать resolveTemplate без изменений.
 */
export function dbTemplateToOfferTemplate(t: {
  id: string;
  name: string;
  description: string | null;
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
