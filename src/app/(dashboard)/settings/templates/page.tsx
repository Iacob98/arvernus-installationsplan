import { listOfferTemplates } from "@/lib/actions/offer-templates";
import {
  listCatalogItems,
  type CatalogItemForClient,
} from "@/lib/actions/catalog";
import { serializeDecimals } from "@/lib/serialize";
import { TemplatesPageClient } from "@/components/templates/templates-page-client";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const [templates, catalogRaw] = await Promise.all([
    listOfferTemplates(),
    listCatalogItems(),
  ]);
  const catalog: CatalogItemForClient[] = serializeDecimals(catalogRaw);
  return <TemplatesPageClient templates={templates} catalog={catalog} />;
}
