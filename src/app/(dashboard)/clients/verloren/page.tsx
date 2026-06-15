export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { getVerloreneClients } from "@/lib/actions/clients";
import { VerlorenKanbanBoard } from "@/components/clients/verloren-kanban-board";

export default async function VerlorenePage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const { mitGrund, ohneGrund } = await getVerloreneClients();

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)]">
      <VerlorenKanbanBoard
        initialMitGrund={mitGrund}
        initialOhneGrund={ohneGrund}
        isAdmin={isAdmin}
      />
    </div>
  );
}
