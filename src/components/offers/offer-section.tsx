"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText } from "lucide-react";

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
  createdBy: { name: string };
}

interface Props {
  clientId: string;
  offers: OfferRow[];
  onNew: () => void;
}

export function OfferSection({ clientId, offers, onNew }: Props) {
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
            {offers.map((o) => (
              <Link
                key={o.id}
                href={`/clients/${clientId}/offers/${o.id}`}
                className="flex items-center justify-between rounded-md border p-3 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">
                      {o.offerNumber} · {o.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("de-DE", {
                        dateStyle: "medium",
                      }).format(o.createdAt)}{" "}
                      · {o.createdBy.name}
                    </p>
                  </div>
                </div>
                <Badge variant={STATUS_VARIANTS[o.status] ?? "outline"}>
                  {STATUS_LABELS[o.status] ?? o.status}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
