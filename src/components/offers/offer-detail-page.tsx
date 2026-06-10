"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Download,
  RefreshCcw,
  Send,
  Trash2,
  FileText,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import type { OfferDetailForClient } from "@/lib/actions/offers";
import { deleteOffer, sendOffer } from "@/lib/actions/offers";
import { calcTotals, fmtEUR } from "@/lib/offer-totals";
import { calcKfw, parseKfwFoerderung } from "@/lib/kfw-foerderung";
import {
  defaultOfferEmailBody,
  DEFAULT_FINANZIERUNG_MONATE,
  DEFAULT_RABATT_FRIST_TAGE,
  DEFAULT_RABATT_PERCENT,
} from "@/lib/offer-email-template";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Entwurf",
  SENT: "Versendet",
  VIEWED: "Gesehen",
  ACCEPTED: "Angenommen",
  REJECTED: "Abgelehnt",
  EXPIRED: "Abgelaufen",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline"> = {
  DRAFT: "secondary",
  SENT: "default",
  VIEWED: "default",
  ACCEPTED: "default",
  REJECTED: "outline",
  EXPIRED: "outline",
};

export function OfferDetailPage({ offer }: { offer: OfferDetailForClient }) {
  const router = useRouter();
  const clientName = `${offer.client.firstName} ${offer.client.lastName}`.trim();

  const totals = calcTotals({
    positions: offer.positions.map((p) => ({
      unitPrice: p.unitPrice,
      quantity: p.quantity,
    })),
    discounts: offer.discounts.map((d) => ({
      kind: d.kind,
      value: d.value,
      label: d.label,
    })),
  });

  const kfw = parseKfwFoerderung(offer.kfwFoerderung);
  const foerderungAmount =
    kfw && kfw.enabled
      ? calcKfw(kfw).amount + totals.foerderungTotal
      : totals.foerderungTotal;

  const defaultSubject = offer.emailSubject ?? `Ihr Angebot ${offer.offerNumber}`;
  const defaultBody =
    offer.emailBody ??
    defaultOfferEmailBody({
      firstName: offer.client.firstName,
      bruttoTotal: totals.brutto,
      foerderungAmount,
      rabattPercent: DEFAULT_RABATT_PERCENT,
      rabattFristTage: DEFAULT_RABATT_FRIST_TAGE,
      finanzierungMonate: DEFAULT_FINANZIERUNG_MONATE,
    });

  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [attachPdf, setAttachPdf] = useState(true);
  const [pending, startTransition] = useTransition();

  function handleSend() {
    if (!offer.client.email) {
      toast.error("Kunde hat keine E-Mail-Adresse");
      return;
    }
    if (offer.client.unsubscribed) {
      toast.error("Kunde ist abgemeldet");
      return;
    }
    startTransition(async () => {
      try {
        await sendOffer(offer.id, { subject, body, attachPdf });
        toast.success("Angebot versendet");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Fehler beim Versand");
      }
    });
  }

  function handleRegenerate() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/offers/${offer.id}/generate`, { method: "POST" });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Fehler bei Generierung");
        }
        toast.success("PDF aktualisiert");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Fehler bei Generierung");
      }
    });
  }

  function handleDelete() {
    if (!confirm("Angebot löschen?")) return;
    startTransition(async () => {
      try {
        await deleteOffer(offer.id);
        toast.success("Gelöscht");
        router.push(`/clients/${offer.clientId}`);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Fehler beim Löschen");
      }
    });
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" asChild className="shrink-0">
            <Link href={`/clients/${offer.clientId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold">{offer.offerNumber}</h1>
              <Badge variant={STATUS_VARIANTS[offer.status]}>
                {STATUS_LABELS[offer.status]}
              </Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              {offer.title} · {clientName}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRegenerate}
            disabled={pending}
            className="flex-1 sm:flex-initial"
          >
            <RefreshCcw className="mr-2 h-4 w-4" /> PDF neu generieren
          </Button>
          {offer.pdfStoragePath && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="flex-1 sm:flex-initial"
            >
              <a href={`/api/offers/${offer.id}/download`} download>
                <Download className="mr-2 h-4 w-4" /> Herunterladen
              </a>
            </Button>
          )}
          {offer.status === "DRAFT" && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={pending}
              className="shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardContent className="p-0 overflow-hidden rounded-md">
              {offer.pdfStoragePath ? (
                <>
                  {/* Mobile: PDF previews inside webview are unreliable on
                      iOS Safari — show a tappable opener instead. */}
                  <a
                    href={`/api/offers/${offer.id}/download?inline=1`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sm:hidden flex items-center justify-between gap-3 p-4 hover:bg-muted/40 active:bg-muted/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded flex items-center justify-center text-white shrink-0"
                        style={{ background: "var(--brand)" }}
                      >
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-sm">
                          PDF öffnen
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {offer.pdfFileName ?? `${offer.offerNumber}.pdf`}
                        </div>
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                  </a>

                  <iframe
                    title="Angebot PDF"
                    src={`/api/offers/${offer.id}/download?inline=1`}
                    className="hidden sm:block w-full"
                    style={{ height: "80vh" }}
                  />
                </>
              ) : (
                <div className="p-8 sm:p-12 text-center text-sm text-muted-foreground">
                  PDF wird generiert. Klicken Sie auf „PDF neu generieren“.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">An Kunden senden</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Empfänger</Label>
                <Input value={offer.client.email ?? ""} readOnly disabled />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Betreff</Label>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Text</Label>
                <Textarea
                  rows={8}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={attachPdf}
                  onChange={(e) => setAttachPdf(e.target.checked)}
                />
                PDF als Anhang
              </label>
              <Button
                onClick={handleSend}
                disabled={pending || !offer.client.email || !offer.pdfStoragePath}
                className="w-full"
              >
                <Send className="mr-2 h-4 w-4" />
                {pending ? "Sendet…" : offer.status === "SENT" ? "Erneut senden" : "Senden"}
              </Button>
              {offer.sentAt && (
                <p className="text-xs text-muted-foreground">
                  Zuletzt versendet:{" "}
                  {new Intl.DateTimeFormat("de-DE", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(offer.sentAt)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Übersicht</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Zwischensumme</span>
                <span>{fmtEUR(totals.subtotal)}</span>
              </div>
              {totals.appliedDiscounts.map((d, i) => (
                <div key={i} className="flex justify-between text-muted-foreground">
                  <span>{d.label}</span>
                  <span>- {fmtEUR(d.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Netto</span>
                <span>{fmtEUR(totals.netto)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">MwSt. 19 %</span>
                <span>{fmtEUR(totals.vat)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2 mt-2">
                <span>Gesamt (Brutto)</span>
                <span>{fmtEUR(totals.brutto)}</span>
              </div>
              {totals.foerderungen.length > 0 && (
                <div className="pt-2 mt-2 border-t">
                  <div className="text-xs text-muted-foreground mb-1">
                    Voraussichtliche Förderungen
                  </div>
                  {totals.foerderungen.map((f, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{f.label}</span>
                      <span>- {fmtEUR(f.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
