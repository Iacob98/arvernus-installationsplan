"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { ClientStatus } from "@prisma/client";
import {
  ClientsKanbanBoard,
  type KanbanClient,
} from "./clients-kanban-board";
import { getClients, getClientCounts } from "@/lib/actions/clients";

type RawClient = Awaited<ReturnType<typeof getClients>>[number];

interface ClientsPageContentProps {
  initialClients: KanbanClient[];
  initialCounts: {
    total: number;
    neu: number;
    inBearbeitung: number;
    angerufen: number;
    angebotVersendet: number;
    verkauft: number;
    nichtVerkauft: number;
  };
  users?: { id: string; name: string; role?: string }[];
  isAdmin?: boolean;
}

function toKanbanClient(c: RawClient): KanbanClient {
  return {
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
    assignedTo: c.assignedTo
      ? { id: c.assignedTo.id, name: c.assignedTo.name }
      : null,
  };
}

export function ClientsPageContent({
  initialClients,
  initialCounts,
  users,
  isAdmin,
}: ClientsPageContentProps) {
  const [clients, setClients] = useState(initialClients);
  const [counts, setCounts] = useState(initialCounts);
  const [search, setSearch] = useState("");
  const [assignedFilter, setAssignedFilter] = useState("ALL");
  const [isPending, startTransition] = useTransition();

  const fetchClients = useCallback(
    (searchVal: string, assigned: string) => {
      startTransition(async () => {
        const aParam = assigned === "ALL" ? undefined : assigned;
        const [newClients, newCounts] = await Promise.all([
          getClients(
            searchVal || undefined,
            undefined as ClientStatus | undefined,
            aParam,
          ),
          getClientCounts(aParam),
        ]);
        setClients(newClients.map(toKanbanClient));
        setCounts(newCounts);
      });
    },
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients(search, assignedFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, assignedFilter, fetchClients]);

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <ClientsKanbanBoard
        clients={clients}
        users={users}
        isAdmin={isAdmin}
        totalCount={counts.total}
        search={search}
        setSearch={setSearch}
        assignedFilter={assignedFilter}
        setAssignedFilter={setAssignedFilter}
      />
      {isPending && (
        <div className="fixed bottom-4 right-4 bg-background border rounded-lg px-3 py-2 text-xs text-muted-foreground shadow-lg">
          Laden…
        </div>
      )}
    </div>
  );
}
