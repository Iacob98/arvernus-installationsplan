"use client";

import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Mail, CheckCircle, XCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface EmailLogEntry {
  id: string;
  subject: string;
  body: string;
  recipients: string[];
  status: "PENDING" | "SENT" | "FAILED";
  createdAt: Date;
  sentBy: { name: string };
}

interface EmailLogSectionProps {
  emailLogs: EmailLogEntry[];
}

const STATUS_CONFIG = {
  PENDING: { icon: Clock, label: "Ausstehend", variant: "outline" as const },
  SENT: { icon: CheckCircle, label: "Gesendet", variant: "default" as const },
  FAILED: { icon: XCircle, label: "Fehlgeschlagen", variant: "destructive" as const },
};

export function EmailLogSection({ emailLogs }: EmailLogSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          E-Mail Verlauf ({emailLogs.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {emailLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine E-Mails gesendet</p>
        ) : (
          <div className="space-y-3">
            {emailLogs.map((log) => {
              const config = STATUS_CONFIG[log.status];
              const Icon = config.icon;
              return (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-lg border text-sm"
                >
                  <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{log.subject}</span>
                      <Badge variant={config.variant} className="shrink-0">
                        {config.label}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground truncate mt-0.5">
                      {log.recipients.join(", ")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(log.createdAt, "dd.MM.yyyy HH:mm", { locale: de })} — {log.sentBy.name}
                    </p>
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
