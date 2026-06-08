"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { ClientStatus } from "@prisma/client";
import { Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ClientsListPane } from "./clients-list-pane";
import { ClientDetailPanel } from "./client-detail-panel";
import {
  getClients,
  getClientCounts,
  type ClientDetail,
} from "@/lib/actions/clients";
import type { CatalogItemForClient } from "@/lib/actions/catalog";
import type { OfferTemplate } from "@/lib/offer-templates";

type ClientWithRelations = Awaited<ReturnType<typeof getClients>>[number];

interface ClientsPageContentProps {
  initialClients: ClientWithRelations[];
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
  selectedClient: ClientDetail | null;
  catalog: CatalogItemForClient[];
  offerTemplates: OfferTemplate[];
}

export function ClientsPageContent({
  initialClients,
  initialCounts,
  users,
  isAdmin,
  selectedClient,
  catalog,
  offerTemplates,
}: ClientsPageContentProps) {
  const [clients, setClients] = useState(initialClients);
  const [counts, setCounts] = useState(initialCounts);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [assignedFilter, setAssignedFilter] = useState("ALL");
  const [isPending, startTransition] = useTransition();

  const fetchClients = useCallback(
    (searchVal: string, status: string, assigned: string) => {
      startTransition(async () => {
        const sFilter = status === "ALL" ? undefined : (status as ClientStatus);
        const aParam = assigned === "ALL" ? undefined : assigned;
        const [newClients, newCounts] = await Promise.all([
          getClients(searchVal || undefined, sFilter, aParam),
          getClientCounts(aParam),
        ]);
        setClients(newClients);
        setCounts(newCounts);
      });
    },
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients(search, statusFilter, assignedFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter, assignedFilter, fetchClients]);

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] xl:h-[calc(100vh-7rem)]">
      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-4 flex-1 min-h-0">
        {/* MASTER */}
        <Card className="flex flex-col min-h-0 overflow-hidden p-0 gap-0">
          <ClientsListPane
            clients={clients}
            selectedId={selectedClient?.id}
            search={search}
            setSearch={setSearch}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            assignedFilter={assignedFilter}
            setAssignedFilter={setAssignedFilter}
            users={users}
            isAdmin={isAdmin}
            totalCount={counts.total}
          />
        </Card>

        {/* DETAIL */}
        <Card className="hidden xl:flex min-h-0 overflow-hidden p-0 gap-0 flex-col">
          {selectedClient ? (
            <div className="overflow-y-auto h-full">
              <ClientDetailPanel
                client={selectedClient}
                catalog={catalog}
                offerTemplates={offerTemplates}
                variant="panel"
                onClose={undefined}
              />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
              <Users className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">Kunde auswählen</p>
              <p className="text-xs mt-1 font-mono text-muted-foreground/60">
                ↑↓ navigieren · ↵ öffnen
              </p>
            </div>
          )}
        </Card>
      </div>

      {isPending && (
        <div className="fixed bottom-4 right-4 bg-background border rounded-lg px-3 py-2 text-xs text-muted-foreground shadow-lg">
          Laden…
        </div>
      )}
    </div>
  );
}
