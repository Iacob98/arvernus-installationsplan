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
import {
  updateClientStatus,
  deleteClient,
  toggleUnsubscribe,
  assignClient,
  updateClientInquiry,
  type ClientDetail,
} from "@/lib/actions/clients";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Check, X } from "lucide-react";
import { ClientStatusSelect } from "./client-status-select";
import { DealProbabilitySelect } from "./deal-probability-select";
import { ReminderSection } from "./reminder-section";
import { ClientNotesSection } from "./client-notes-section";
import { ClientAttachmentsSection } from "./client-attachments-section";
import { EmailComposeDialog } from "./email-compose-dialog";
import { EmailLogSection } from "./email-log-section";
import { OfferSection } from "@/components/offers/offer-section";
import { OfferWizardDialog } from "@/components/offers/offer-wizard-dialog";
import { CallLogSection } from "./call-log-section";
import type { CatalogItemForClient } from "@/lib/actions/catalog";
import { toast } from "sonner";

interface ClientDetailContentProps {
  client: ClientDetail;
  users?: { id: string; name: string }[];
  isAdmin?: boolean;
  catalog: CatalogItemForClient[];
}

const INQUIRY_FIELDS: { key: keyof ClientDetail; label: string }[] = [
  { key: "wohnflaecheM2", label: "Beheizte Wohnfläche (m²)" },
  { key: "annualKwhGas", label: "Jahresverbrauch (kWh / Öl / m³)" },
  { key: "wohneinheiten", label: "Anzahl Wohneinheiten" },
  { key: "heizsystem", label: "Heizsystem" },
  { key: "hotWaterIncluded", label: "Warmwasser durch Wärmepumpe" },
  { key: "currentHeating", label: "Aktueller Heizungstyp" },
  { key: "heatingAge", label: "Alter / Baujahr der Heizung" },
  { key: "incomeRange", label: "Haushaltseinkommen / Jahr" },
  { key: "ownership", label: "Eigentumsverhältnis" },
  { key: "buildingType", label: "Gebäudetyp" },
  { key: "constructionYear", label: "Baujahr" },
  { key: "householdSize", label: "Personenanzahl im Haushalt" },
  { key: "currentFuel", label: "Genutzter Brennstoff" },
  { key: "timeframe", label: "Zeitrahmen" },
  { key: "availability", label: "Erreichbarkeit" },
  { key: "annualLitersOil", label: "Jahresverbrauch in Liter (Heizöl)" },
];

function InquiryDetailsCard({ client }: { client: ClientDetail }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const f of INQUIRY_FIELDS) initial[f.key] = (client[f.key] as string) ?? "";
    initial.additionalInfo = client.additionalInfo ?? "";
    return initial;
  });

  function startEdit() {
    const initial: Record<string, string> = {};
    for (const f of INQUIRY_FIELDS) initial[f.key] = (client[f.key] as string) ?? "";
    initial.additionalInfo = client.additionalInfo ?? "";
    setDraft(initial);
    setEditing(true);
  }

  function cancel() {
    setEditing(false);
  }

  function save() {
    startTransition(async () => {
      try {
        await updateClientInquiry(client.id, draft);
        toast.success("Anfragedetails gespeichert");
        setEditing(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Fehler beim Speichern");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Anfragedetails</CardTitle>
        {editing ? (
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={cancel} disabled={pending}>
              <X className="h-4 w-4 mr-1" />
              Abbrechen
            </Button>
            <Button size="sm" onClick={save} disabled={pending}>
              <Check className="h-4 w-4 mr-1" />
              {pending ? "Speichern…" : "Speichern"}
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={startEdit}>
            <Pencil className="h-3 w-3 mr-1" />
            Bearbeiten
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {INQUIRY_FIELDS.map((f) => (
            <div key={f.key} className="space-y-1">
              <Label className="text-xs text-muted-foreground">{f.label}</Label>
              {editing ? (
                <Input
                  value={draft[f.key] ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [f.key]: e.target.value }))
                  }
                />
              ) : (
                <p className="text-sm">
                  {(client[f.key] as string) || (
                    <span className="text-muted-foreground/60">—</span>
                  )}
                </p>
              )}
            </div>
          ))}
        </div>
        <div className="space-y-1 pt-2 border-t">
          <Label className="text-xs text-muted-foreground">
            Zusätzliche Projektinformationen
          </Label>
          {editing ? (
            <Textarea
              rows={3}
              value={draft.additionalInfo ?? ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, additionalInfo: e.target.value }))
              }
            />
          ) : client.additionalInfo ? (
            <p className="text-sm whitespace-pre-wrap">{client.additionalInfo}</p>
          ) : (
            <p className="text-sm text-muted-foreground/60">—</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ClientDetailContent({ client, users, isAdmin, catalog }: ClientDetailContentProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showOfferWizard, setShowOfferWizard] = useState(false);

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

      {/* Anrufe */}
      <CallLogSection clientId={client.id} callLogs={client.callLogs} />

      {/* Angebote */}
      <OfferSection
        clientId={client.id}
        offers={client.offers}
        onNew={() => setShowOfferWizard(true)}
      />

      {/* Reminders */}
      <ReminderSection clientId={client.id} reminders={client.reminders} />

      {/* Anfragedetails */}
      <InquiryDetailsCard client={client} />

      {/* Notes / Verlauf */}
      <ClientNotesSection clientId={client.id} notes={client.clientNotes} />

      {/* Attachments */}
      <ClientAttachmentsSection
        clientId={client.id}
        attachments={client.attachments}
      />

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

      {/* Offer Wizard */}
      <OfferWizardDialog
        open={showOfferWizard}
        onOpenChange={setShowOfferWizard}
        clientId={client.id}
        clientName={`${client.firstName} ${client.lastName}`.trim()}
        inquiry={{
          wohnflaecheM2: client.wohnflaecheM2,
          annualKwhGas: client.annualKwhGas,
          wohneinheiten: client.wohneinheiten,
          constructionYear: client.constructionYear,
          householdSize: client.householdSize,
          heizsystem: client.heizsystem,
          hotWaterIncluded: client.hotWaterIncluded,
          currentHeating: client.currentHeating,
          heatingAge: client.heatingAge,
          incomeRange: client.incomeRange,
          additionalInfo: client.additionalInfo,
        }}
        catalog={catalog}
      />

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
