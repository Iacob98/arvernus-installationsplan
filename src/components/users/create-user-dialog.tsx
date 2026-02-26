"use client";

import { useState, useTransition } from "react";
import { Role } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Copy, AlertTriangle } from "lucide-react";
import { createUser } from "@/lib/actions/users";
import { toast } from "sonner";

interface CreateUserDialogProps {
  onCreated: (user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    active: boolean;
    createdAt: Date;
    _count: { assignedClients: number };
  }) => void;
}

export function CreateUserDialog({ onCreated }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("TECHNICIAN");
  const [generatedPin, setGeneratedPin] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    startTransition(async () => {
      try {
        const result = await createUser({ name, email, role });
        setGeneratedPin(result.pin);
        onCreated({
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role as Role,
          active: true,
          createdAt: new Date(),
          _count: { assignedClients: 0 },
        });
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Fehler beim Erstellen");
      }
    });
  }

  function handleClose() {
    setOpen(false);
    setName("");
    setEmail("");
    setRole("TECHNICIAN");
    setGeneratedPin(null);
  }

  function copyPin() {
    if (generatedPin) {
      navigator.clipboard.writeText(generatedPin);
      toast.success("PIN kopiert");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : handleClose())}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Neuer Benutzer
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {generatedPin ? "Benutzer erstellt" : "Neuer Benutzer"}
          </DialogTitle>
        </DialogHeader>

        {generatedPin ? (
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-3 bg-yellow-50 rounded-md text-yellow-800 text-sm">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>Der PIN wird nur einmal angezeigt. Bitte notieren Sie ihn jetzt.</span>
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">PIN für {name}</p>
              <p className="text-3xl font-mono font-bold tracking-widest">{generatedPin}</p>
              <Button variant="outline" size="sm" onClick={copyPin}>
                <Copy className="h-4 w-4 mr-2" />
                PIN kopieren
              </Button>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Schließen</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Vor- und Nachname"
              />
            </div>
            <div className="space-y-2">
              <Label>E-Mail</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@beispiel.de"
              />
            </div>
            <div className="space-y-2">
              <Label>Rolle</Label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="TECHNICIAN">Techniker</SelectItem>
                  <SelectItem value="VIEWER">Betrachter</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Abbrechen
              </Button>
              <Button onClick={handleCreate} disabled={isPending || !name || !email}>
                {isPending ? "Erstellen..." : "Erstellen"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
