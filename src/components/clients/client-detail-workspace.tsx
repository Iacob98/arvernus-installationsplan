"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNowStrict } from "date-fns";
import { de } from "date-fns/locale";
import {
  Phone,
  FileText,
  Bell,
  StickyNote,
  Mail,
  MapPin,
  ArrowLeft,
  Trash2,
  Send,
  Handshake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ClientStatus } from "@prisma/client";
import { ClientPipeline } from "./client-pipeline";
import { InquiryEditor } from "./inquiry-editor";
import { CallLogSection, CallLogDialog } from "./call-log-section";
import { OfferWizardDialog } from "@/components/offers/offer-wizard-dialog";
import { OfferSection } from "@/components/offers/offer-section";
import { ClientNotesSection } from "./client-notes-section";
import { ClientAttachmentsSection } from "./client-attachments-section";
import { EmailLogSection } from "./email-log-section";
import {
  createClientNote,
  deleteClient,
  markClientImKontakt,
  type ClientDetail,
} from "@/lib/actions/clients";
import type { CatalogItemForClient } from "@/lib/actions/catalog";
import type { OfferTemplate } from "@/lib/offer-templates";

const STATUS_COLORS: Record<ClientStatus, string> = {
  NEU: "#8b5cf6",
  ANGERUFEN: "#06b6d4",
  ANGEBOT_VERSENDET: "#d97706",
  IM_KONTAKT: "#7c3aed",
  VERKAUFT: "#059669",
  NICHT_VERKAUFT: "#52525b",
};

const STATUS_LABELS: Record<ClientStatus, string> = {
  NEU: "Neu",
  ANGERUFEN: "Angerufen",
  ANGEBOT_VERSENDET: "Angebot versendet",
  IM_KONTAKT: "In Kontakt",
  VERKAUFT: "Verkauft",
  NICHT_VERKAUFT: "Verloren",
};

interface Props {
  client: ClientDetail;
  catalog: CatalogItemForClient[];
  offerTemplates: OfferTemplate[];
}

export function ClientDetailWorkspace({
  client,
  catalog,
  offerTemplates,
}: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [showOfferWizard, setShowOfferWizard] = useState(false);
  const [showCallSheet, setShowCallSheet] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteSending, setNoteSending] = useState(false);
  const [tab, setTab] = useState("anfrage");

  const clientName = `${client.firstName} ${client.lastName}`.trim();
  const statusColor = STATUS_COLORS[client.status];

  useEffect(() => {
    setNoteDraft("");
  }, [client.id]);

  async function sendNote() {
    const text = noteDraft.trim();
    if (!text) return;
    setNoteSending(true);
    try {
      await createClientNote(client.id, text);
      setNoteDraft("");
      toast.success("Notiz hinzugefügt");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Fehler");
    } finally {
      setNoteSending(false);
    }
  }

  function handleDelete() {
    if (!confirm(`Kunde ${clientName} löschen?`)) return;
    startTransition(async () => {
      try {
        await deleteClient(client.id);
        toast.success("Gelöscht");
        router.push("/clients");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Fehler beim Löschen");
      }
    });
  }

  const events = buildActivityEvents(client);

  return (
    <div className="min-h-[calc(100vh-7rem)]">
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr]">
        <aside
          className="lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto border-r border-border/60 px-4 py-5 flex flex-col gap-5"
          style={{ background: "var(--brand-muted)" }}
        >
          <div>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-7 px-2 -ml-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <Link href="/clients">
                <ArrowLeft className="h-3 w-3 mr-1" /> Zurück
              </Link>
            </Button>
            <h1 className="mt-2 text-xl font-bold leading-tight tracking-tight">
              {client.salutation ? `${client.salutation} ` : ""}
              {clientName}
            </h1>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className="font-mono text-[10px] tabular-nums tracking-tight bg-card"
              >
                {client.customerNumber}
              </Badge>
              <span
                className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded text-[10px] font-medium"
                style={{ background: `${statusColor}1A`, color: statusColor }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: statusColor }}
                />
                {STATUS_LABELS[client.status]}
              </span>
              {client.unsubscribed && (
                <Badge variant="destructive" className="text-[9px] uppercase">
                  abgemeldet
                </Badge>
              )}
            </div>
          </div>

          <ClientPipeline status={client.status} />

          <div className="space-y-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Schnelle Aktion
            </div>
            <Button
              size="lg"
              className="w-full h-11 justify-start font-medium"
              style={{ background: "var(--brand)", color: "var(--brand-foreground)" }}
              onClick={() => setShowCallSheet(true)}
            >
              <Phone className="h-4 w-4 mr-2" />
              Anruf protokollieren
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full h-11 justify-start font-medium bg-card"
              style={{
                color: "var(--brand)",
                borderColor: "color-mix(in srgb, var(--brand) 35%, transparent)",
              }}
              onClick={() => setShowOfferWizard(true)}
            >
              <FileText className="h-4 w-4 mr-2" />
              Angebot erstellen
            </Button>
            {client.status === "ANGEBOT_VERSENDET" &&
              client.offers.some((o) => o.status === "SENT") && (
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full h-11 justify-start font-medium bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/30 dark:hover:bg-violet-950/50 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-900"
                  onClick={() => {
                    startTransition(async () => {
                      try {
                        await markClientImKontakt(client.id);
                        toast.success("Kunde ist nun In Kontakt");
                        router.refresh();
                      } catch (e) {
                        toast.error(
                          e instanceof Error
                            ? e.message
                            : "Fehler beim Statuswechsel",
                        );
                      }
                    });
                  }}
                >
                  <Handshake className="h-4 w-4 mr-2" />
                  In Kontakt setzen
                </Button>
              )}
          </div>

          <div className="space-y-2">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Kontakt
            </div>
            <div className="bg-card border border-border/60 rounded-md p-2.5 text-xs space-y-1.5">
              <div className="flex items-start gap-2">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <div>
                    {client.street} {client.houseNumber}
                  </div>
                  <div className="text-muted-foreground">
                    {client.postalCode} {client.city}
                  </div>
                </div>
              </div>
              {client.email ? (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <a
                    href={`mailto:${client.email}`}
                    className="hover:underline truncate"
                  >
                    {client.email}
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground/60">
                  <Mail className="h-3.5 w-3.5 shrink-0" /> Keine E-Mail
                </div>
              )}
              {client.phone ? (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <a href={`tel:${client.phone}`} className="hover:underline">
                    {client.phone}
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground/60">
                  <Phone className="h-3.5 w-3.5 shrink-0" /> Keine Telefonnummer
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2 flex flex-col">
            <div className="flex items-center justify-between">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Schnellnotiz
              </div>
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground/60">
                {client.clientNotes.length}
              </span>
            </div>
            <div className="bg-card border border-border/60 rounded-md overflow-hidden">
              <Textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault();
                    sendNote();
                  }
                }}
                placeholder="Was wurde besprochen?"
                className="min-h-[80px] text-xs border-0 rounded-none resize-y focus-visible:ring-0"
              />
              <div className="flex items-center justify-between px-2 py-1.5 border-t border-border/60 bg-muted/30">
                <span className="font-mono text-[9px] text-muted-foreground/70">
                  ⌘ + ↵ senden
                </span>
                <Button
                  size="sm"
                  className="h-7 text-xs"
                  style={{ background: "var(--brand)", color: "var(--brand-foreground)" }}
                  disabled={!noteDraft.trim() || noteSending}
                  onClick={sendNote}
                >
                  <Send className="h-3 w-3 mr-1" />
                  {noteSending ? "Senden…" : "Senden"}
                </Button>
              </div>
            </div>
            {client.clientNotes.length > 0 && (
              <div className="space-y-1.5 mt-1 max-h-[200px] overflow-y-auto">
                {client.clientNotes.slice(0, 5).map((n) => (
                  <div
                    key={n.id}
                    className="bg-card border border-border/60 rounded-md p-2"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[9px] uppercase tracking-wide text-muted-foreground">
                        {n.author.name}
                      </span>
                      <span className="font-mono text-[9px] tabular-nums text-muted-foreground/60">
                        {formatDistanceToNowStrict(n.createdAt, { locale: de })}
                      </span>
                    </div>
                    <p className="text-xs whitespace-pre-wrap leading-snug">
                      {n.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-auto space-y-1 pt-3 border-t border-border/40">
            {client.assignedTo && (
              <div className="text-[10px] text-muted-foreground">
                Zugewiesen an{" "}
                <span className="font-medium text-foreground">
                  {client.assignedTo.name}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={handleDelete}
              className="flex items-center gap-1 text-[10px] text-destructive/70 hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3 w-3" /> Kunde löschen
            </button>
          </div>
        </aside>

        <main className="px-5 py-5 space-y-5 min-w-0">
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Aktivität
              </h2>
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground/60">
                {events.length} Ereignisse
              </span>
            </div>
            <ActivityTimeline events={events} />
          </section>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="w-full justify-start bg-transparent border-b border-border/60 rounded-none h-auto p-0 gap-1">
              {[
                { v: "anfrage", l: "Anfrage" },
                { v: "anrufe", l: `Anrufe (${client.callLogs.length})` },
                { v: "angebote", l: `Angebote (${client.offers.length})` },
                { v: "verlauf", l: "Verlauf" },
                { v: "dateien", l: "Dateien" },
                { v: "projekte", l: `Projekte (${client.projects.length})` },
              ].map((t) => (
                <TabsTrigger
                  key={t.v}
                  value={t.v}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-[var(--brand)] data-[state=active]:bg-transparent px-3 py-2 text-xs"
                >
                  {t.l}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="anfrage" className="mt-4">
              <InquiryEditor client={client} />
            </TabsContent>
            <TabsContent value="anrufe" className="mt-4">
              <CallLogSection clientId={client.id} callLogs={client.callLogs} />
            </TabsContent>
            <TabsContent value="angebote" className="mt-4">
              <OfferSection
                clientId={client.id}
                offers={client.offers}
                onNew={() => setShowOfferWizard(true)}
              />
            </TabsContent>
            <TabsContent value="verlauf" className="mt-4 space-y-4">
              <ClientNotesSection clientId={client.id} notes={client.clientNotes} />
              <EmailLogSection emailLogs={client.emailLogs} />
            </TabsContent>
            <TabsContent value="dateien" className="mt-4">
              <ClientAttachmentsSection
                clientId={client.id}
                attachments={client.attachments}
              />
            </TabsContent>
            <TabsContent value="projekte" className="mt-4">
              <div className="bg-card border border-border/60 rounded-md p-4">
                {client.projects.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Keine Projekte</p>
                ) : (
                  <div className="space-y-2">
                    {client.projects.map((p) => (
                      <Link
                        key={p.id}
                        href={`/projects/${p.id}`}
                        className="block p-3 rounded-md border border-border/40 hover:border-foreground/30 hover:bg-muted/30 transition-colors"
                      >
                        <p className="text-sm font-medium">{p.title}</p>
                        <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
                          {p.projectNumber}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </main>
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

      <CallLogDialog
        open={showCallSheet}
        onOpenChange={setShowCallSheet}
        clientId={client.id}
      />
    </div>
  );
}

type ActivityEvent = {
  type: "call" | "offer" | "reminder" | "note" | "email";
  date: Date;
  text: string;
};

function buildActivityEvents(client: ClientDetail): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  for (const c of client.callLogs) {
    const outcome =
      c.outcome === "REACHED"
        ? "erreicht"
        : c.outcome === "NOT_REACHED"
          ? "nicht erreicht"
          : c.outcome === "VOICEMAIL"
            ? "Mailbox"
            : "besetzt";
    events.push({
      type: "call",
      date: c.calledAt,
      text: `Anruf · ${outcome}${c.notes ? ` · ${c.notes.slice(0, 80)}` : ""}`,
    });
  }
  for (const o of client.offers) {
    events.push({
      type: "offer",
      date: o.createdAt,
      text: `Angebot ${o.offerNumber} · ${o.title}`,
    });
  }
  for (const r of client.reminders) {
    events.push({
      type: "reminder",
      date: r.date,
      text: `Erinnerung · ${r.description}`,
    });
  }
  for (const n of client.clientNotes) {
    events.push({
      type: "note",
      date: n.createdAt,
      text: `Notiz · ${n.content.slice(0, 80)}`,
    });
  }
  for (const e of client.emailLogs) {
    events.push({
      type: "email",
      date: e.createdAt,
      text: `E-Mail · ${e.subject}`,
    });
  }
  events.sort((a, b) => b.date.getTime() - a.date.getTime());
  return events.slice(0, 20);
}

function ActivityTimeline({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="bg-card border border-border/60 rounded-md p-6 text-center font-mono text-xs text-muted-foreground">
        — noch keine Aktivität —
      </div>
    );
  }
  return (
    <div className="bg-card border border-border/60 rounded-md p-3 max-h-[280px] overflow-y-auto">
      <ol className="relative">
        <div className="absolute left-[7px] top-1 bottom-1 w-px bg-border/60" />
        {events.map((e, i) => (
          <li
            key={i}
            className="relative flex items-start gap-3 py-1.5 last:pb-0"
          >
            <span
              className="relative z-10 mt-1 h-3.5 w-3.5 rounded-full border border-border/70 flex items-center justify-center shrink-0"
              style={{ background: "var(--brand-muted)" }}
            >
              <ActivityIcon type={e.type} />
            </span>
            <div className="min-w-0 flex-1 flex items-start justify-between gap-2">
              <span className="text-xs text-foreground/90 truncate">
                {e.text}
              </span>
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground shrink-0">
                {formatDistanceToNowStrict(e.date, { locale: de })}
              </span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function ActivityIcon({ type }: { type: ActivityEvent["type"] }) {
  const cls = "h-2 w-2";
  const color = "var(--brand)";
  if (type === "call") return <Phone className={cls} style={{ color }} />;
  if (type === "offer") return <FileText className={cls} style={{ color }} />;
  if (type === "reminder") return <Bell className={cls} style={{ color }} />;
  if (type === "note") return <StickyNote className={cls} style={{ color }} />;
  if (type === "email") return <Mail className={cls} style={{ color }} />;
  return null;
}
