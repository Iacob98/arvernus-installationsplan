export const dynamic = "force-dynamic";

import Link from "next/link";
import { getClients } from "@/lib/actions/clients";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Users } from "lucide-react";

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kunden</h1>
          <p className="text-muted-foreground">
            {clients.length} Kunde{clients.length !== 1 ? "n" : ""}
          </p>
        </div>
        <Link href="/clients/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Neuer Kunde
          </Button>
        </Link>
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">Keine Kunden</h3>
            <p className="text-muted-foreground mb-4">
              Erstellen Sie Ihren ersten Kunden
            </p>
            <Link href="/clients/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Kunde erstellen
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {clients.map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center justify-between gap-2 py-4">
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {client.salutation} {client.firstName} {client.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {client.customerNumber} — {client.street}{" "}
                      {client.houseNumber}, {client.postalCode} {client.city}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground shrink-0">
                    {client._count.projects} Projekt{client._count.projects !== 1 ? "e" : ""}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
