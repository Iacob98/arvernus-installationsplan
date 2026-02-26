"use client";

import Link from "next/link";
import { startOfDay } from "date-fns";
import { Bell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClientStatus, ClientSubstatus, DealProbability } from "@prisma/client";

interface ClientCardProps {
  client: {
    id: string;
    salutation: string | null;
    firstName: string;
    lastName: string;
    customerNumber: string;
    street: string;
    houseNumber: string;
    postalCode: string;
    city: string;
    status: ClientStatus;
    substatus: ClientSubstatus | null;
    dealProbability: DealProbability | null;
    source: string | null;
    unsubscribed: boolean;
    _count: { projects: number };
    reminders: { id: string; date: Date; completed: boolean }[];
    assignedTo?: { name: string } | null;
  };
}

const STATUS_COLORS: Record<ClientStatus, string> = {
  NEU: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  IN_BEARBEITUNG: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  VERKAUFT: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  NICHT_VERKAUFT: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
};

const STATUS_LABELS: Record<ClientStatus, string> = {
  NEU: "Neu",
  IN_BEARBEITUNG: "In Bearbeitung",
  VERKAUFT: "Verkauft",
  NICHT_VERKAUFT: "Nicht verkauft",
};

const SUBSTATUS_LABELS: Record<ClientSubstatus, string> = {
  IN_KONTAKT: "In Kontakt",
  ANGEBOT_VERSENDET: "Angebot versendet",
  NICHT_ERREICHBAR: "Nicht erreichbar",
};

const PROBABILITY_DOTS: Record<DealProbability, string> = {
  NIEDRIG: "bg-red-500",
  MITTEL: "bg-yellow-500",
  HOCH: "bg-green-500",
};

export function ClientCard({ client }: ClientCardProps) {
  const today = startOfDay(new Date());
  const activeReminders = client.reminders.filter((r) => !r.completed);
  const hasOverdue = activeReminders.some((r) => startOfDay(r.date) < today);
  const hasTodayReminder = activeReminders.some(
    (r) => startOfDay(r.date).getTime() === today.getTime()
  );

  return (
    <Link href={`/clients/${client.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="flex items-center justify-between gap-2 py-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">
                {client.salutation} {client.firstName} {client.lastName}
              </p>
              {activeReminders.length > 0 && (
                <Bell
                  className={`h-3.5 w-3.5 shrink-0 ${
                    hasOverdue
                      ? "text-red-500"
                      : hasTodayReminder
                        ? "text-orange-500"
                        : "text-muted-foreground"
                  }`}
                />
              )}
              {client.unsubscribed && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                  Abgemeldet
                </Badge>
              )}
              {client.source === "website" && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  Web
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {client.customerNumber} — {client.street} {client.houseNumber},{" "}
              {client.postalCode} {client.city}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {client.assignedTo && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {client.assignedTo.name}
              </Badge>
            )}
            {client.dealProbability && (
              <span
                className={`h-2 w-2 rounded-full ${PROBABILITY_DOTS[client.dealProbability]}`}
              />
            )}
            {client.substatus && (
              <Badge variant="outline" className="text-xs">
                {SUBSTATUS_LABELS[client.substatus]}
              </Badge>
            )}
            <Badge className={`text-xs ${STATUS_COLORS[client.status]}`}>
              {STATUS_LABELS[client.status]}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {client._count.projects} Projekt{client._count.projects !== 1 ? "e" : ""}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
