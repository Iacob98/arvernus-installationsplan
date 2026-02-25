export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getClient } from "@/lib/actions/clients";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";
import { ClientDetailContent } from "@/components/clients/client-detail-content";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const client = await getClient(clientId);
  if (!client) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zurück
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {client.salutation} {client.firstName} {client.lastName}
          </h1>
          <p className="text-muted-foreground">{client.customerNumber}</p>
        </div>
        <Link href={`/clients/${clientId}/edit`}>
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4 mr-1" />
            Bearbeiten
          </Button>
        </Link>
      </div>

      <ClientDetailContent client={client} />
    </div>
  );
}
