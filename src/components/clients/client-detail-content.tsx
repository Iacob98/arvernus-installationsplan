"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClientStatus, ClientSubstatus, DealProbability } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Trash2, MailX, MailCheck } from "lucide-react";
import { updateClientStatus, deleteClient, toggleUnsubscribe, assignClient, type ClientDetail } from "@/lib/actions/clients";
import { ClientStatusSelect } from "./client-status-select";
import { DealProbabilitySelect } from "./deal-probability-select";
import { ReminderSection } from "./reminder-section";
import { ClientNotesSection } from "./client-notes-section";
import { EmailComposeDialog } from "./email-compose-dialog";
import { EmailLogSection } from "./email-log-section";
import { toast } from "sonner";

interface ClientDetailContentProps {
  client: ClientDetail;
  users?: { id: string; name: string }[];
  isAdmin?: boolean;
}

export function ClientDetailContent({ client, users, isAdmin }: ClientDetailContentProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  function handleStatusChange(status: ClientStatus) {
    startTransition(async () => {
      try {
        await updateClientStatus(client.id, status);
      } catch {
        toast.error("Fehler beim Aktualisieren");
      }
    });
  }

  function handleSubstatusChange(substatus: ClientSubstatus | null) {
    startTransition(async () => {
      try {
        await updateClientStatus(client.id, client.status, substatus);
      } catch {
        toast.error("Fehler beim Aktualisieren");
      }
    });
  }

  function handleProbabilityChange(probability: DealProbability | null) {
    startTransition(async () => {
      try {
        await updateClientStatus(client.id, client.status, undefined, probability);
      } catch {
        toast.error("Fehler beim Aktualisieren");
      }
    });
  }

  function handleAssignChange(userId: string) {
    startTransition(async () => {
      try {
        await assignClient(client.id, userId === "none" ? null : userId);
        toast.success("Zuweisung aktualisiert");
      } catch {
        toast.error("Fehler beim Zuweisen");
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteClient(client.id);
        router.push("/clients");
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Fehler beim Löschen"
        );
        setShowDeleteDialog(false);
      }
    });
  }

  function handleToggleUnsubscribe() {
    startTransition(async () => {
      try {
        await toggleUnsubscribe(client.id, !client.unsubscribed);
        toast.success(
          client.unsubscribed
            ? "Kunde wieder für Kampagnen angemeldet"
            : "Kunde von Kampagnen abgemeldet"
        );
      } catch {
        toast.error("Fehler beim Aktualisieren");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Contact info */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Kontaktdaten</CardTitle>
            <EmailComposeDialog
              clientId={client.id}
              clientEmail={client.email}
              clientName={`${client.firstName} ${client.lastName}`}
            />
          </CardHeader>
          <CardContent className="space-y-3">
            {client.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                {client.email}
                {client.unsubscribed && (
                  <Badge variant="destructive" className="text-xs">
                    Abgemeldet
                  </Badge>
                )}
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {client.phone}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              {client.street} {client.houseNumber}, {client.postalCode}{" "}
              {client.city}
            </div>
            {client.source && (
              <div className="pt-2">
                <Badge variant="outline" className="text-xs">
                  Quelle: {client.source === "website" ? "Webseite" : client.source}
                </Badge>
              </div>
            )}
            {client.notes && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {client.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status & Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle>Status & Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ClientStatusSelect
              status={client.status}
              substatus={client.substatus}
              onStatusChange={handleStatusChange}
              onSubstatusChange={handleSubstatusChange}
            />
            {client.status === "IN_BEARBEITUNG" && (
              <DealProbabilitySelect
                value={client.dealProbability}
                onChange={handleProbabilityChange}
              />
            )}
            {isAdmin && users && users.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Zugewiesen an</Label>
                <Select
                  value={client.assignedToId || "none"}
                  onValueChange={handleAssignChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nicht zugewiesen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nicht zugewiesen</SelectItem>
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {!isAdmin && client.assignedTo && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Zugewiesen an</Label>
                <p className="text-sm">{client.assignedTo.name}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reminders */}
      <ReminderSection clientId={client.id} reminders={client.reminders} />

      {/* Notes / Verlauf */}
      <ClientNotesSection clientId={client.id} notes={client.clientNotes} />

      {/* Projects */}
      <Card>
        <CardHeader>
          <CardTitle>Projekte ({client.projects.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {client.projects.length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Projekte</p>
          ) : (
            <div className="space-y-2">
              {client.projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="block p-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <p className="font-medium text-sm">{project.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {project.projectNumber}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Email Log */}
      <EmailLogSection emailLogs={client.emailLogs} />

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Aktionen</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={handleToggleUnsubscribe}
          >
            {client.unsubscribed ? (
              <>
                <MailCheck className="h-4 w-4 mr-2" />
                Wieder anmelden
              </>
            ) : (
              <>
                <MailX className="h-4 w-4 mr-2" />
                Von Kampagnen abmelden
              </>
            )}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Löschen
          </Button>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kunde löschen?</DialogTitle>
            <DialogDescription>
              Möchten Sie {client.firstName} {client.lastName} wirklich löschen?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isPending}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? "Wird gelöscht..." : "Löschen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
