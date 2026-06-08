export const dynamic = "force-dynamic";

import {
  getClient,
  getClients,
  getClientCounts,
} from "@/lib/actions/clients";
import { getActiveUsers } from "@/lib/actions/users";
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
import { auth } from "@/lib/auth";
import { ClientsPageContent } from "@/components/clients/clients-page-content";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ selected?: string }>;
}) {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";
  const sp = await searchParams;
  const selectedId = sp.selected;

  const [
    clients,
    counts,
    users,
    selectedClient,
    catalogRaw,
    templatesRaw,
  ] = await Promise.all([
    getClients(),
    getClientCounts(),
    isAdmin ? getActiveUsers() : Promise.resolve([]),
    selectedId ? getClient(selectedId) : Promise.resolve(null),
    listActiveCatalogItems(),
    listActiveOfferTemplates(),
  ]);

  const catalog: CatalogItemForClient[] = serializeDecimals(catalogRaw);
  const offerTemplates: OfferTemplate[] = templatesRaw.map(
    dbTemplateToOfferTemplate,
  );

  return (
    <ClientsPageContent
      initialClients={clients}
      initialCounts={counts}
      users={isAdmin ? users : undefined}
      isAdmin={isAdmin}
      selectedClient={selectedClient}
      catalog={catalog}
      offerTemplates={offerTemplates}
    />
  );
}
