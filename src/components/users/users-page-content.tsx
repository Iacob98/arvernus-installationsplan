"use client";

import { useState, useTransition } from "react";
import { Role } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toggleUserActive } from "@/lib/actions/users";
import { CreateUserDialog } from "./create-user-dialog";
import { ResetPinDialog } from "./reset-pin-dialog";
import { toast } from "sonner";

type UserItem = {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: Date;
  _count: { assignedClients: number };
};

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  TECHNICIAN: "Techniker",
  VIEWER: "Betrachter",
};

const ROLE_COLORS: Record<Role, string> = {
  ADMIN: "bg-red-100 text-red-800",
  MANAGER: "bg-blue-100 text-blue-800",
  TECHNICIAN: "bg-green-100 text-green-800",
  VIEWER: "bg-gray-100 text-gray-800",
};

interface UsersPageContentProps {
  initialUsers: UserItem[];
}

export function UsersPageContent({ initialUsers }: UsersPageContentProps) {
  const [users, setUsers] = useState(initialUsers);
  const [isPending, startTransition] = useTransition();

  function handleToggleActive(userId: string, active: boolean) {
    startTransition(async () => {
      try {
        await toggleUserActive(userId, active);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, active } : u))
        );
        toast.success(active ? "Benutzer aktiviert" : "Benutzer deaktiviert");
      } catch {
        toast.error("Fehler beim Aktualisieren");
      }
    });
  }

  function handleUserCreated(user: UserItem) {
    setUsers((prev) => [user, ...prev]);
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Benutzer</h1>
          <p className="text-muted-foreground">
            {users.length} Benutzer
          </p>
        </div>
        <CreateUserDialog onCreated={handleUserCreated} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>E-Mail</TableHead>
              <TableHead>Rolle</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Kunden</TableHead>
              <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge className={ROLE_COLORS[user.role]}>
                    {ROLE_LABELS[user.role]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={user.active ? "default" : "secondary"}>
                    {user.active ? "Aktiv" : "Inaktiv"}
                  </Badge>
                </TableCell>
                <TableCell>{user._count.assignedClients}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <ResetPinDialog userId={user.id} userName={user.name} />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleToggleActive(user.id, !user.active)}
                    >
                      {user.active ? "Deaktivieren" : "Aktivieren"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
