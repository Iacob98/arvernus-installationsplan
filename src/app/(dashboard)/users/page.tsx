export const dynamic = "force-dynamic";

import { getUsers } from "@/lib/actions/users";
import { UsersPageContent } from "@/components/users/users-page-content";

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="space-y-6">
      <UsersPageContent initialUsers={users} />
    </div>
  );
}
