export const dynamic = "force-dynamic";

import { getClients, getClientCounts } from "@/lib/actions/clients";
import { ClientsPageContent } from "@/components/clients/clients-page-content";

export default async function ClientsPage() {
  const [clients, counts] = await Promise.all([
    getClients(),
    getClientCounts(),
  ]);

  return (
    <ClientsPageContent initialClients={clients} initialCounts={counts} />
  );
}
