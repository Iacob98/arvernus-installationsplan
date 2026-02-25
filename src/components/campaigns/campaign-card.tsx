"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "lucide-react";

type CampaignCardProps = {
  id: string;
  name: string;
  status: "DRAFT" | "SENDING" | "COMPLETED";
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  templateName: string;
  createdAt: Date;
};

const statusLabels: Record<string, string> = {
  DRAFT: "Entwurf",
  SENDING: "Wird gesendet",
  COMPLETED: "Abgeschlossen",
};

const statusVariants: Record<string, "default" | "secondary" | "outline"> = {
  DRAFT: "outline",
  SENDING: "default",
  COMPLETED: "secondary",
};

export function CampaignCard({
  name,
  status,
  recipientCount,
  sentCount,
  failedCount,
  templateName,
  createdAt,
}: CampaignCardProps) {
  const progress = recipientCount > 0 ? Math.round(((sentCount + failedCount) / recipientCount) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{name}</CardTitle>
          <Badge variant={statusVariants[status]}>{statusLabels[status]}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">Vorlage: {templateName}</p>
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{sentCount} / {recipientCount} gesendet</span>
            {failedCount > 0 && (
              <span className="text-destructive">{failedCount} fehlgeschlagen</span>
            )}
          </div>
          <Progress value={progress} />
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3" />
          {new Date(createdAt).toLocaleDateString("de-DE")}
        </div>
      </CardContent>
    </Card>
  );
}
