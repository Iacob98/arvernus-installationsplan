"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Send } from "lucide-react";
import { toast } from "sonner";
import { sendOffer } from "@/lib/actions/offers";

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

interface OfferRow {
  id: string;
  offerNumber: string;
  title: string;
  status: string;
  createdAt: Date;
  sentAt: Date | null;
  emailSubject: string | null;
  emailBody: string | null;
  createdBy: { name: string };
}

interface Props {
  clientId: string;
  offers: OfferRow[];
  onNew: () => void;
  clientHasEmail?: boolean;
}

export function OfferSection({
  clientId,
  offers,
  onNew,
  clientHasEmail = false,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleResend(o: OfferRow, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!clientHasEmail) {
      toast.error("Kunde hat keine E-Mail-Adresse");
      return;
    }
    if (!o.emailSubject || !o.emailBody) {
      // Legacy offers without saved subject/body — fall back to detail page.
      router.push(`/clients/${clientId}/offers/${o.id}`);
      return;
    }
    startTransition(async () => {
      try {
        await sendOffer(o.id, {
          subject: o.emailSubject!,
          body: o.emailBody!,
          attachPdf: true,
        });
        toast.success("Angebot erneut versendet");
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Fehler beim Senden",
        );
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Angebote ({offers.length})</CardTitle>
        <Button size="sm" onClick={onNew}>
          <Plus className="mr-1 h-3 w-3" /> Neues Angebot
        </Button>
      </CardHeader>
      <CardContent>
        {offers.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine Angebote.</p>
        ) : (
          <div className="space-y-2">
            {offers.map((o) => {
              const wasSent =
                o.status === "SENT" ||
                o.status === "VIEWED" ||
                o.status === "ACCEPTED";
              return (
                <div
                  key={o.id}
                  className="flex items-center justify-between gap-2 rounded-md border p-3 hover:bg-muted/40 transition-colors"
                >
                  <Link
                    href={`/clients/${clientId}/offers/${o.id}`}
                    className="flex items-center gap-3 min-w-0 flex-1"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {o.offerNumber} · {o.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {new Intl.DateTimeFormat("de-DE", {
                          dateStyle: "medium",
                        }).format(o.createdAt)}{" "}
                        · {o.createdBy.name}
                        {o.sentAt && (
                          <>
                            {" · gesendet "}
                            {new Intl.DateTimeFormat("de-DE", {
                              dateStyle: "short",
                            }).format(o.sentAt)}
                          </>
                        )}
                      </p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 shrink-0">
                    {wasSent && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pending || !clientHasEmail}
                        onClick={(e) => handleResend(o, e)}
                        title={
                          !clientHasEmail
                            ? "Keine E-Mail-Adresse"
                            : "Angebot erneut senden"
                        }
                      >
                        <Send className="h-3.5 w-3.5 mr-1" />
                        <span className="hidden sm:inline">Erneut</span>
                      </Button>
                    )}
                    <Badge variant={STATUS_VARIANTS[o.status] ?? "outline"}>
                      {STATUS_LABELS[o.status] ?? o.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
