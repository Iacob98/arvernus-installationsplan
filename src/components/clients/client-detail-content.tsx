"use client";

import { useTransition } from "react";
import Link from "next/link";
import { ClientStatus, ClientSubstatus, DealProbability } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin } from "lucide-react";
import { updateClientStatus } from "@/lib/actions/clients";
import { ClientStatusSelect } from "./client-status-select";
import { DealProbabilitySelect } from "./deal-probability-select";
import { ReminderSection } from "./reminder-section";
import { EmailComposeDialog } from "./email-compose-dialog";
import { EmailLogSection } from "./email-log-section";
import { toast } from "sonner";

interface ClientDetailContentProps {
  client: {
    id: string;
    salutation: string | null;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    street: string;
    houseNumber: string;
    postalCode: string;
    city: string;
    status: ClientStatus;
    substatus: ClientSubstatus | null;
    dealProbability: DealProbability | null;
    source: string | null;
    notes: string | null;
    projects: {
      id: string;
      title: string;
      projectNumber: string;
      createdBy: { name: string };
    }[];
    reminders: {
      id: string;
      date: Date;
      description: string;
      completed: boolean;
    }[];
    emailLogs: {
      id: string;
      subject: string;
      body: string;
      recipients: string[];
      status: "PENDING" | "SENT" | "FAILED";
      createdAt: Date;
      sentBy: { name: string };
    }[];
  };
}

export function ClientDetailContent({ client }: ClientDetailContentProps) {
  const [isPending, startTransition] = useTransition();

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

        {/* Status & Probability */}
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
          </CardContent>
        </Card>
      </div>

      {/* Reminders */}
      <ReminderSection clientId={client.id} reminders={client.reminders} />

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
    </div>
  );
}
