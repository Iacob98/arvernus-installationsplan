export const dynamic = "force-dynamic";

import { getClients, getClientCounts } from "@/lib/actions/clients";
import { getActiveUsers } from "@/lib/actions/users";
import { auth } from "@/lib/auth";
import { ClientsPageContent } from "@/components/clients/clients-page-content";
import type { KanbanClient } from "@/components/clients/clients-kanban-board";

export default async function ClientsPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const [clients, counts, users] = await Promise.all([
    getClients(),
    getClientCounts(),
    isAdmin ? getActiveUsers() : Promise.resolve([]),
  ]);

  const kanbanClients: KanbanClient[] = clients.map((c) => ({
    id: c.id,
    salutation: c.salutation,
    firstName: c.firstName,
    lastName: c.lastName,
    customerNumber: c.customerNumber,
    city: c.city,
    status: c.status,
    source: c.source,
    unsubscribed: c.unsubscribed,
    updatedAt: c.updatedAt,
    reminders: c.reminders.map((r) => ({
      id: r.id,
      date: r.date,
      completed: r.completed,
    })),
    ownership: c.ownership,
    constructionYear: c.constructionYear,
    buildingType: c.buildingType,
    heatingAge: c.heatingAge,
    annualKwhGas: c.annualKwhGas,
    annualLitersOil: c.annualLitersOil,
    wohnflaecheM2: c.wohnflaecheM2,
    incomeRange: c.incomeRange,
    callsCount: c._count.callLogs,
    offersCount: c._count.offers,
    emailsCount: c._count.emailLogs,
    lastCall: c.callLogs[0]?.calledAt ?? null,
    lastOffer: c.offers[0]?.createdAt ?? null,
    unreadInboundCount: c.unreadInboundCount,
    lastInboundAt: c.lastInboundAt,
    assignedTo: c.assignedTo
      ? { id: c.assignedTo.id, name: c.assignedTo.name }
      : null,
  }));

  return (
    <ClientsPageContent
      initialClients={kanbanClients}
      initialCounts={counts}
      users={isAdmin ? users : undefined}
      isAdmin={isAdmin}
    />
  );
}
