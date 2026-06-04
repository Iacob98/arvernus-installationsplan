import { listCatalogItems, type CatalogItemForClient } from "@/lib/actions/catalog";
import { CatalogPageClient } from "@/components/catalog/catalog-page-client";
import { serializeDecimals } from "@/lib/serialize";

export const dynamic = "force-dynamic";

export default async function CatalogPage() {
  const itemsRaw = await listCatalogItems();
  const items: CatalogItemForClient[] = serializeDecimals(itemsRaw);
  return <CatalogPageClient items={items} />;
}
