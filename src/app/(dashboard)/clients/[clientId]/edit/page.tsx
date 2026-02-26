export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { getClient } from "@/lib/actions/clients";
import { getActiveUsers } from "@/lib/actions/users";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth-utils";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { EditClientForm } from "./edit-client-form";

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;
  const client = await getClient(clientId);
  if (!client) notFound();

  const session = await auth();
  const admin = session ? isAdmin(session) : false;
  const users = admin ? await getActiveUsers() : [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/clients/${clientId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zurück
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">
          {client.firstName} {client.lastName} bearbeiten
        </h1>
      </div>
      <EditClientForm client={client} users={users} isAdmin={admin} />
    </div>
  );
}
