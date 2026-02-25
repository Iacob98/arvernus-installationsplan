"use client";

import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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

type Props = {
  templates: Template[];
  campaigns: Campaign[];
};

export function CampaignsPageContent({ templates, campaigns }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kampagnen</h1>
      </div>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">Vorlagen</TabsTrigger>
          <TabsTrigger value="campaigns">Kampagnen</TabsTrigger>
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
      </Tabs>
    </div>
  );
}
