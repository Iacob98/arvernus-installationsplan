"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ClientStatus, ClientSubstatus, DealProbability } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail,
  Phone,
  MapPin,
  Pencil,
  X,
  Trash2,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import {
  updateClientStatus,
  deleteClient,
  toggleUnsubscribe,
  type ClientDetail,
} from "@/lib/actions/clients";
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
import { ClientPipeline } from "./client-pipeline";
import { InquiryEditor } from "./inquiry-editor";
import type { CatalogItemForClient } from "@/lib/actions/catalog";
import type { OfferTemplate } from "@/lib/offer-templates";

interface Props {
  client: ClientDetail;
  catalog: CatalogItemForClient[];
  offerTemplates: OfferTemplate[];
  variant?: "panel" | "page";
  onClose?: () => void;
}

export function ClientDetailPanel({
  client,
  catalog,
  offerTemplates,
  variant = "panel",
  onClose,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [showOfferWizard, setShowOfferWizard] = useState(false);
  const [tab, setTab] = useState("uebersicht");

  const clientName = `${client.firstName} ${client.lastName}`.trim();

  function handleStatus(status: ClientStatus) {
    startTransition(async () => {
      try {
        await updateClientStatus(client.id, status);
      } catch {
        toast.error("Fehler beim Aktualisieren");
      }
    });
  }
  function handleSubstatus(sub: ClientSubstatus | null) {
    startTransition(async () => {
      try {
        await updateClientStatus(client.id, client.status, sub);
      } catch {
        toast.error("Fehler beim Aktualisieren");
      }
    });
  }
  function handleProb(p: DealProbability | null) {
    startTransition(async () => {
      try {
        await updateClientStatus(client.id, client.status, undefined, p);
      } catch {
        toast.error("Fehler beim Aktualisieren");
      }
    });
  }
  function handleDelete() {
    if (!confirm(`Kunde ${clientName} löschen?`)) return;
    startTransition(async () => {
      try {
        await deleteClient(client.id);
        toast.success("Gelöscht");
        if (variant === "panel") router.push("/clients");
        else router.push("/clients");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Fehler");
      }
    });
  }
  function handleUnsubscribe() {
    startTransition(async () => {
      try {
        await toggleUnsubscribe(client.id, !client.unsubscribed);
        toast.success(client.unsubscribed ? "Wieder angemeldet" : "Abgemeldet");
      } catch {
        toast.error("Fehler");
      }
    });
  }

  return (
    <div className="flex flex-col h-full">
      {/* HEADER */}
      <div className="border-b bg-card px-4 py-3 flex flex-wrap items-start justify-between gap-3 shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold truncate">
              {client.salutation ? `${client.salutation} ` : ""}
              {clientName}
            </h1>
            <Badge
              variant="outline"
              className="font-mono text-[10px] tracking-tight"
            >
              {client.customerNumber}
            </Badge>
            {client.unsubscribed && (
              <Badge variant="destructive" className="text-[10px]">
                Abgemeldet
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
            <MapPin className="h-3 w-3" />
            {client.street} {client.houseNumber}, {client.postalCode} {client.city}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button asChild size="sm" variant="ghost">
            <Link href={`/clients/${client.id}/edit`}>
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Bearbeiten
            </Link>
          </Button>
          {variant === "panel" && (
            <Button size="sm" variant="ghost" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Pipeline */}
      <div className="px-4 pt-3 shrink-0">
        <ClientPipeline status={client.status} />
      </div>

      {/* BODY: Sidebar + Tabs */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 p-4">
        {/* Sidebar */}
        <aside className="space-y-3 lg:sticky lg:top-4 self-start">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
                Kontakt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0 text-xs leading-relaxed">
                  <div>
                    {client.street} {client.houseNumber}
                  </div>
                  <div>
                    {client.postalCode} {client.city}
                  </div>
                </div>
              </div>
              {client.email ? (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <a
                    href={`mailto:${client.email}`}
                    className="hover:underline truncate text-xs"
                  >
                    {client.email}
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  Keine E-Mail
                </div>
              )}
              {client.phone ? (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <a
                    href={`tel:${client.phone}`}
                    className="hover:underline truncate text-xs"
                  >
                    {client.phone}
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  Keine Telefonnummer
                </div>
              )}
              {client.source && (
                <div className="text-[10px] text-muted-foreground pt-1 border-t">
                  Quelle:{" "}
                  <span className="font-medium">
                    {client.source === "website" ? "Webseite" : client.source}
                  </span>
                </div>
              )}
              {client.notes && (
                <p className="text-xs text-muted-foreground whitespace-pre-wrap pt-2 border-t">
                  {client.notes}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
                Aktionen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                size="sm"
                className="w-full justify-start"
                style={{ background: "var(--brand)", color: "var(--brand-foreground)" }}
                onClick={() => setShowOfferWizard(true)}
              >
                <Plus className="h-3.5 w-3.5 mr-2" /> Angebot erstellen
              </Button>
              <EmailComposeDialog
                clientId={client.id}
                clientEmail={client.email}
                clientName={clientName}
              />
              <Button
                size="sm"
                variant="outline"
                className="w-full justify-start"
                onClick={handleUnsubscribe}
              >
                {client.unsubscribed ? "Wieder anmelden" : "Abmelden (Kampagnen)"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" /> Löschen
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
                Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <ClientStatusSelect
                status={client.status}
                substatus={client.substatus}
                onStatusChange={handleStatus}
                onSubstatusChange={handleSubstatus}
              />
              {client.status === "IN_BEARBEITUNG" && (
                <DealProbabilitySelect
                  value={client.dealProbability}
                  onChange={handleProb}
                />
              )}
              {client.assignedTo && (
                <p className="text-xs text-muted-foreground pt-2 border-t">
                  Zugewiesen: <span className="font-medium">{client.assignedTo.name}</span>
                </p>
              )}
            </CardContent>
          </Card>
        </aside>

        {/* Main tabs */}
        <div className="min-w-0">
          <Tabs value={tab} onValueChange={setTab} className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="uebersicht">Übersicht</TabsTrigger>
              <TabsTrigger value="anfrage">Anfrage</TabsTrigger>
              <TabsTrigger value="verlauf">Verlauf</TabsTrigger>
              <TabsTrigger value="dateien">Dateien</TabsTrigger>
              <TabsTrigger value="projekte">
                Projekte ({client.projects.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="uebersicht" className="space-y-4 mt-4">
              <CallLogSection clientId={client.id} callLogs={client.callLogs} />
              <OfferSection
                clientId={client.id}
                offers={client.offers}
                onNew={() => setShowOfferWizard(true)}
              />
              <ReminderSection
                clientId={client.id}
                reminders={client.reminders}
              />
            </TabsContent>

            <TabsContent value="anfrage" className="mt-4">
              <InquiryEditor client={client} />
            </TabsContent>

            <TabsContent value="verlauf" className="space-y-4 mt-4">
              <ClientNotesSection
                clientId={client.id}
                notes={client.clientNotes}
              />
              <EmailLogSection emailLogs={client.emailLogs} />
            </TabsContent>

            <TabsContent value="dateien" className="mt-4">
              <ClientAttachmentsSection
                clientId={client.id}
                attachments={client.attachments}
              />
            </TabsContent>

            <TabsContent value="projekte" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Projekte ({client.projects.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  {client.projects.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Keine Projekte
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {client.projects.map((project) => (
                        <Link
                          key={project.id}
                          href={`/projects/${project.id}`}
                          className="block p-3 rounded-md hover:bg-muted transition-colors"
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
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <OfferWizardDialog
        open={showOfferWizard}
        onOpenChange={setShowOfferWizard}
        clientId={client.id}
        clientName={clientName}
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
        offerTemplates={offerTemplates}
      />
    </div>
  );
}
