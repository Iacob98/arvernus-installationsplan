export const dynamic = "force-dynamic";

import { getClients, getClientCounts } from "@/lib/actions/clients";
import { getActiveUsers } from "@/lib/actions/users";
import { auth } from "@/lib/auth";
import { ClientsPageContent } from "@/components/clients/clients-page-content";

export default async function ClientsPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const [clients, counts, users] = await Promise.all([
    getClients(),
    getClientCounts(),
    isAdmin ? getActiveUsers() : Promise.resolve([]),
  ]);

  return (
    <ClientsPageContent
      initialClients={clients}
      initialCounts={counts}
      users={isAdmin ? users : undefined}
      isAdmin={isAdmin}
    />
  );
}
