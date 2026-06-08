export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth-utils";
import { getActiveUsers } from "@/lib/actions/users";
import { generateCustomerNumber } from "@/lib/actions/clients";
import { NewClientForm } from "@/components/clients/new-client-form";

export default async function NewClientPage() {
  const session = await auth();
  const admin = session ? isAdmin(session) : false;
  const [users, customerNumber] = await Promise.all([
    admin ? getActiveUsers() : Promise.resolve([] as { id: string; name: string }[]),
    generateCustomerNumber(),
  ]);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Neuer Kunde</h1>
      <NewClientForm
        users={users}
        isAdmin={admin}
        defaultCustomerNumber={customerNumber}
      />
    </div>
  );
}
