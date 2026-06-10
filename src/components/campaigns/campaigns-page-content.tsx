"use client";

import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Mail, Clock } from "lucide-react";
import { TemplateCard } from "./template-card";
import { CampaignCard } from "./campaign-card";

type Template = {
  id: string;
  name: string;
  subject: string;
  createdAt: Date;
  _count: { images: number };
};

type Campaign = {
  id: string;
  name: string;
  status: "DRAFT" | "SENDING" | "COMPLETED";
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  createdAt: Date;
  template: { name: string; subject: string };
  createdBy: { name: string };
};

type ReminderTemplate = {
  step: number;
  subject: string;
  htmlBody: string;
  updatedAt: Date;
};

const REMINDER_DAYS: Record<number, number> = { 1: 2, 2: 5, 3: 6, 4: 10 };

type Props = {
  templates: Template[];
  campaigns: Campaign[];
  reminderTemplates?: ReminderTemplate[];
  isAdmin?: boolean;
};

export function CampaignsPageContent({
  templates,
  campaigns,
  reminderTemplates = [],
  isAdmin = false,
}: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kampagnen</h1>
      </div>

      <Tabs defaultValue="templates">
        <TabsList scrollable>
          <TabsTrigger value="templates">Vorlagen</TabsTrigger>
          <TabsTrigger value="campaigns">Kampagnen</TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="reminders">Angebot-Erinnerungen</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          <div className="flex justify-end">
            <Button asChild>
              <Link href="/campaigns/templates/new">
                <Plus className="h-4 w-4 mr-2" />
                Neue Vorlage
              </Link>
            </Button>
          </div>

          {templates.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Noch keine Vorlagen vorhanden. Erstellen Sie eine neue Vorlage.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {templates.map((t) => (
                <TemplateCard
                  key={t.id}
                  id={t.id}
                  name={t.name}
                  subject={t.subject}
                  imageCount={t._count.images}
                  createdAt={t.createdAt}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <div className="flex justify-end">
            <Button asChild>
              <Link href="/campaigns/new">
                <Plus className="h-4 w-4 mr-2" />
                Neue Kampagne
              </Link>
            </Button>
          </div>

          {campaigns.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Noch keine Kampagnen vorhanden.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((c) => (
                <CampaignCard
                  key={c.id}
                  id={c.id}
                  name={c.name}
                  status={c.status}
                  recipientCount={c.recipientCount}
                  sentCount={c.sentCount}
                  failedCount={c.failedCount}
                  templateName={c.template.name}
                  createdAt={c.createdAt}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {isAdmin && (
          <TabsContent value="reminders" className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Automatische Erinnerungen werden nach dem Versand eines Angebots
              an den Kunden gesendet, falls dieser nicht in <strong>VERKAUFT</strong>{" "}
              übergeht. Verfügbare Platzhalter:{" "}
              <code className="bg-muted px-1 rounded">{"{{firstName}}"}</code>{" "}
              und{" "}
              <code className="bg-muted px-1 rounded">{"{{managerName}}"}</code>.
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {reminderTemplates.map((t) => (
                <Link
                  key={t.step}
                  href={`/campaigns/templates/reminders/${t.step}`}
                >
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Schritt {t.step} — Tag {REMINDER_DAYS[t.step]}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1.5">
                      <div className="flex items-start gap-2 text-sm">
                        <Mail className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                        <span className="font-medium">{t.subject}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Zuletzt geändert:{" "}
                        {new Date(t.updatedAt).toLocaleDateString("de-DE")}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
