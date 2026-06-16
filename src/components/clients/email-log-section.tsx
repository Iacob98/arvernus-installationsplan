"use client";

import { format } from "date-fns";
import { de } from "date-fns/locale";
import {
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Reply,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface EmailLogEntry {
  id: string;
  subject: string;
  body: string;
  htmlBody: string | null;
  recipients: string[];
  status: "PENDING" | "SENT" | "FAILED";
  direction: "INBOUND" | "OUTBOUND";
  fromAddress: string | null;
  read: boolean;
  createdAt: Date;
  sentBy: { name: string } | null;
}

interface EmailLogSectionProps {
  emailLogs: EmailLogEntry[];
  onReply?: (log: EmailLogEntry) => void;
}

const STATUS_CONFIG = {
  PENDING: { icon: Clock, label: "Ausstehend", variant: "outline" as const },
  SENT: { icon: CheckCircle, label: "Gesendet", variant: "default" as const },
  FAILED: {
    icon: XCircle,
    label: "Fehlgeschlagen",
    variant: "destructive" as const,
  },
};

export function EmailLogSection({ emailLogs, onReply }: EmailLogSectionProps) {
  // Ungelesene eingegangene Mails nach oben — stabiler Sort behält innerhalb
  // der Gruppen die vom Server gelieferte Reihenfolge (createdAt desc) bei.
  const sorted = [...emailLogs].sort((a, b) => {
    const aNew = a.direction === "INBOUND" && !a.read ? 1 : 0;
    const bNew = b.direction === "INBOUND" && !b.read ? 1 : 0;
    return bNew - aNew;
  });

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
          <p className="text-sm text-muted-foreground">Keine E-Mails</p>
        ) : (
          <div className="space-y-3">
            {sorted.map((log) => {
              const isInbound = log.direction === "INBOUND";
              const isUnread = isInbound && !log.read;
              const config = STATUS_CONFIG[log.status];
              const DirIcon = isInbound ? ArrowDownLeft : ArrowUpRight;
              return (
                <div
                  key={log.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border text-sm ${
                    isUnread
                      ? "bg-blue-100 dark:bg-blue-900/50 border-blue-500 dark:border-blue-500 ring-2 ring-blue-500/50 shadow-sm"
                      : isInbound
                        ? "bg-blue-50/60 dark:bg-blue-950/20 border-blue-200/70 dark:border-blue-900/50"
                        : "bg-card"
                  }`}
                >
                  <DirIcon
                    className={`h-4 w-4 mt-0.5 shrink-0 ${
                      isInbound
                        ? "text-blue-600 dark:text-blue-300"
                        : "text-muted-foreground"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{log.subject}</span>
                      {isInbound && !log.read && (
                        <Badge
                          variant="default"
                          className="shrink-0 bg-blue-600 hover:bg-blue-600"
                        >
                          Neu
                        </Badge>
                      )}
                      {!isInbound && (
                        <Badge variant={config.variant} className="shrink-0">
                          {config.label}
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground truncate mt-0.5">
                      {isInbound
                        ? `Von: ${log.fromAddress ?? "—"}`
                        : `An: ${log.recipients.join(", ")}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(log.createdAt, "dd.MM.yyyy HH:mm", {
                        locale: de,
                      })}
                      {" — "}
                      {isInbound
                        ? "Eingegangen"
                        : (log.sentBy?.name ?? "System")}
                    </p>

                    <details className="mt-2" open={isInbound && !log.read}>
                      <summary
                        className={`cursor-pointer text-xs ${
                          isInbound
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-muted-foreground"
                        }`}
                      >
                        Nachricht anzeigen
                      </summary>
                      {log.htmlBody ? (
                        <iframe
                          srcDoc={log.htmlBody}
                          sandbox=""
                          className="w-full h-72 border rounded mt-2 bg-white"
                          title={`Nachricht ${log.subject}`}
                        />
                      ) : (
                        <pre className="mt-2 whitespace-pre-wrap text-xs bg-card border rounded p-2 max-h-72 overflow-auto">
                          {log.body}
                        </pre>
                      )}
                    </details>

                    {isInbound && onReply && (
                      <div className="mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onReply(log)}
                        >
                          <Reply className="h-3 w-3 mr-1" />
                          Antworten
                        </Button>
                      </div>
                    )}
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
