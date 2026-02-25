"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import Link from "next/link";
import { ClientStatus } from "@prisma/client";
import { Plus, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ClientCard } from "./client-card";
import { BulkEmailDialog } from "./bulk-email-dialog";
import { getClients, getClientCounts } from "@/lib/actions/clients";

type ClientWithRelations = Awaited<ReturnType<typeof getClients>>[number];

interface ClientsPageContentProps {
  initialClients: ClientWithRelations[];
  initialCounts: {
    total: number;
    inBearbeitung: number;
    verkauft: number;
    nichtVerkauft: number;
  };
}

export function ClientsPageContent({
  initialClients,
  initialCounts,
}: ClientsPageContentProps) {
  const [clients, setClients] = useState(initialClients);
  const [counts, setCounts] = useState(initialCounts);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [isPending, startTransition] = useTransition();

  const fetchClients = useCallback(
    (searchVal: string, status: string) => {
      startTransition(async () => {
        const statusFilter = status === "ALL" ? undefined : (status as ClientStatus);
        const [newClients, newCounts] = await Promise.all([
          getClients(searchVal || undefined, statusFilter),
          getClientCounts(),
        ]);
        setClients(newClients);
        setCounts(newCounts);
      });
    },
    []
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients(search, activeTab);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, activeTab, fetchClients]);

  const tabItems = [
    { value: "ALL", label: "Alle", count: counts.total },
    { value: "IN_BEARBEITUNG", label: "In Bearbeitung", count: counts.inBearbeitung },
    { value: "VERKAUFT", label: "Verkauft", count: counts.verkauft },
    { value: "NICHT_VERKAUFT", label: "Nicht verkauft", count: counts.nichtVerkauft },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kunden</h1>
          <p className="text-muted-foreground">
            {counts.total} Kunde{counts.total !== 1 ? "n" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BulkEmailDialog />
          <Link href="/clients/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Neuer Kunde
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Suche nach Name, Kundennummer, Stadt..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {tabItems.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label} ({tab.count})
            </TabsTrigger>
          ))}
        </TabsList>

        {tabItems.map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            {clients.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Keine Kunden</h3>
                  <p className="text-muted-foreground mb-4">
                    {search
                      ? "Keine Ergebnisse für die Suche"
                      : "Erstellen Sie Ihren ersten Kunden"}
                  </p>
                  {!search && (
                    <Link href="/clients/new">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Kunde erstellen
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3">
                {clients.map((client) => (
                  <ClientCard key={client.id} client={client} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {isPending && (
        <div className="fixed bottom-4 right-4 bg-background border rounded-lg px-3 py-2 text-sm text-muted-foreground shadow-lg">
          Laden...
        </div>
      )}
    </div>
  );
}
