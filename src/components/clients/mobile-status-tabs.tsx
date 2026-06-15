"use client";

import Link from "next/link";
import { ClientStatus } from "@prisma/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Column,
  STATUS_LABELS,
  type KanbanClient,
} from "./clients-kanban-board";

interface Props {
  grouped: Record<ClientStatus, KanbanClient[]>;
  isAdmin?: boolean;
}

const SHORT_LABEL: Record<ClientStatus, string> = {
  NEU: "Neu",
  ANGERUFEN: "Angerufen",
  ANGEBOT_VERSENDET: "Angebot",
  IM_KONTAKT: "In Kontakt",
  VERKAUFT: "Verkauft",
  NICHT_VERKAUFT: "Verloren",
};

const ACTIVE_STATUSES: ClientStatus[] = [
  "NEU",
  "ANGERUFEN",
  "ANGEBOT_VERSENDET",
  "IM_KONTAKT",
  "VERKAUFT",
];

export function MobileStatusTabs({ grouped, isAdmin }: Props) {
  const initial: ClientStatus =
    ACTIVE_STATUSES.find((s) => grouped[s].length > 0) ?? "NEU";
  const verlorenCount = grouped["NICHT_VERKAUFT"].length;

  return (
    <Tabs defaultValue={initial} className="flex flex-col h-full">
      <div className="shrink-0 overflow-x-auto overflow-y-hidden -mx-3 px-3 border-b border-border/60 bg-card">
        <TabsList
          className="flex-nowrap justify-start bg-transparent h-auto p-1 gap-0.5 w-max"
          aria-label="Status"
        >
          {ACTIVE_STATUSES.map((status) => {
            const n = grouped[status].length;
            return (
              <TabsTrigger
                key={status}
                value={status}
                className="text-xs px-3 py-1.5 whitespace-nowrap data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                {SHORT_LABEL[status] ?? STATUS_LABELS[status]}
                <span className="ml-1 font-mono tabular-nums text-[10px] text-muted-foreground">
                  {n}
                </span>
              </TabsTrigger>
            );
          })}
          <Link
            href="/clients/verloren"
            className="inline-flex items-center text-xs px-3 py-1.5 whitespace-nowrap rounded-md text-muted-foreground hover:bg-background/60 hover:text-foreground transition-colors"
          >
            {SHORT_LABEL["NICHT_VERKAUFT"]}
            <span className="ml-1 font-mono tabular-nums text-[10px] text-muted-foreground">
              {verlorenCount}
            </span>
          </Link>
        </TabsList>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-3 pt-2 pb-3">
        {ACTIVE_STATUSES.map((status) => (
          <TabsContent
            key={status}
            value={status}
            className="mt-0 data-[state=inactive]:hidden h-full"
          >
            <Column
              status={status}
              items={grouped[status]}
              isAdmin={isAdmin}
              widthClass="w-full"
            />
          </TabsContent>
        ))}
      </div>
    </Tabs>
  );
}
