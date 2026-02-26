export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth-utils";
import { getActiveUsers } from "@/lib/actions/users";
import { NewClientForm } from "@/components/clients/new-client-form";

export default async function NewClientPage() {
  const session = await auth();
  const admin = session ? isAdmin(session) : false;
  const users = admin ? await getActiveUsers() : [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Neuer Kunde</h1>
      <NewClientForm users={users} isAdmin={admin} />
    </div>
  );
}
