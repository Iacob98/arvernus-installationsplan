export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getClient } from "@/lib/actions/clients";
import { markInboundRead } from "@/lib/actions/emails";
import {
  listActiveCatalogItems,
  type CatalogItemForClient,
} from "@/lib/actions/catalog";
import { listActiveOfferTemplates } from "@/lib/actions/offer-templates";
import {
  dbTemplateToOfferTemplate,
  type OfferTemplate,
} from "@/lib/offer-templates";
import { serializeDecimals } from "@/lib/serialize";
import { ClientDetailWorkspace } from "@/components/clients/client-detail-workspace";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  const [client, catalogRaw, templatesRaw] = await Promise.all([
    getClient(clientId),
    listActiveCatalogItems(),
    listActiveOfferTemplates(),
  ]);
  if (!client) notFound();

  // Mark any unread inbound emails as read on visit. Failure is non-fatal.
  await markInboundRead(clientId).catch(() => {});

  const catalog: CatalogItemForClient[] = serializeDecimals(catalogRaw);
  const offerTemplates: OfferTemplate[] = templatesRaw.map(
    dbTemplateToOfferTemplate,
  );

  return (
    <ClientDetailWorkspace
      client={client}
      catalog={catalog}
      offerTemplates={offerTemplates}
    />
  );
}
