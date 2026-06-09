"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatDistanceToNowStrict, startOfDay } from "date-fns";
import { de } from "date-fns/locale";
import { ClientStatus } from "@prisma/client";
import {
  Flame,
  Search,
  Plus,
  Phone,
  Mail,
  FileText,
  ChevronRight,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calcLeadScore } from "@/lib/lead-scoring";

export type KanbanClient = {
  id: string;
  salutation: string | null;
  firstName: string;
  lastName: string;
  customerNumber: string;
  city: string;
  status: ClientStatus;
  source: string | null;
  unsubscribed: boolean;
  updatedAt: Date;
  reminders: { id: string; date: Date; completed: boolean }[];
  ownership?: string | null;
  constructionYear?: string | null;
  buildingType?: string | null;
  heatingAge?: string | null;
  annualKwhGas?: string | null;
  annualLitersOil?: string | null;
  wohnflaecheM2?: string | null;
  incomeRange?: string | null;
  callsCount: number;
  offersCount: number;
  emailsCount: number;
  lastCall: Date | null;
  lastOffer: Date | null;
  assignedTo?: { id: string; name: string } | null;
};

const STATUS_ORDER: ClientStatus[] = [
  "NEU",
  "ANGERUFEN",
  "ANGEBOT_VERSENDET",
  "IM_KONTAKT",
  "VERKAUFT",
  "NICHT_VERKAUFT",
];

const STATUS_LABELS: Record<ClientStatus, string> = {
  NEU: "Neu",
  ANGERUFEN: "Angerufen",
  ANGEBOT_VERSENDET: "Angebot versendet",
  IM_KONTAKT: "In Kontakt",
  VERKAUFT: "Verkauft",
  NICHT_VERKAUFT: "Verloren",
};

const STATUS_COLORS: Record<ClientStatus, string> = {
  NEU: "#8b5cf6",
  ANGERUFEN: "#06b6d4",
  ANGEBOT_VERSENDET: "#d97706",
  IM_KONTAKT: "#7c3aed",
  VERKAUFT: "#059669",
  NICHT_VERKAUFT: "#52525b",
};

interface Props {
  clients: KanbanClient[];
  users?: { id: string; name: string }[];
  isAdmin?: boolean;
  totalCount: number;
  search: string;
  setSearch: (v: string) => void;
  assignedFilter?: string;
  setAssignedFilter?: (v: string) => void;
}

export function ClientsKanbanBoard({
  clients,
  users,
  isAdmin,
  totalCount,
  search,
  setSearch,
  assignedFilter,
  setAssignedFilter,
}: Props) {
  const [lostExpanded, setLostExpanded] = useState(false);

  const grouped = useMemo(() => {
    const g: Record<ClientStatus, KanbanClient[]> = {
      NEU: [],
      ANGERUFEN: [],
      ANGEBOT_VERSENDET: [],
      IM_KONTAKT: [],
      VERKAUFT: [],
      NICHT_VERKAUFT: [],
    };
    for (const c of clients) g[c.status]?.push(c);
    return g;
  }, [clients]);

  return (
    <div className="flex flex-col h-full">
      <header className="shrink-0 border-b border-border/60 bg-card px-4 py-2.5 flex items-center gap-3 flex-wrap">
        <div className="flex items-baseline gap-2 mr-auto">
          <h1 className="text-base font-semibold tracking-tight">Pipeline</h1>
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            {clients.length}
            <span className="text-muted-foreground/60"> / {totalCount}</span>
          </span>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, Nummer, Stadt…"
            className="h-8 pl-7 text-sm bg-transparent border border-border rounded-md focus-visible:ring-0 focus-visible:border-[var(--brand)]"
          />
        </div>
        {isAdmin && users && users.length > 0 && setAssignedFilter && (
          <Select value={assignedFilter ?? "ALL"} onValueChange={setAssignedFilter}>
            <SelectTrigger className="h-8 w-44 text-xs">
              <Filter className="h-3 w-3 mr-1 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Alle Mitarbeiter</SelectItem>
              <SelectItem value="UNASSIGNED">Nicht zugewiesen</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Button
          asChild
          size="sm"
          className="h-8 text-xs"
          style={{ background: "var(--brand)", color: "var(--brand-foreground)" }}
        >
          <Link href="/clients/new">
            <Plus className="h-3.5 w-3.5 mr-1" /> Neuer Kunde
          </Link>
        </Button>
      </header>

      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 h-full px-3 pt-3 pb-2 min-w-max">
          {STATUS_ORDER.map((status) => {
            const items = grouped[status];
            const isCollapsedLost = status === "NICHT_VERKAUFT" && !lostExpanded;
            if (isCollapsedLost) {
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setLostExpanded(true)}
                  className="shrink-0 w-10 h-full bg-card border border-border/70 rounded-md flex flex-col items-center py-3 gap-3 hover:border-foreground/30 transition-colors group"
                  style={{ borderTop: `3px solid ${STATUS_COLORS[status]}` }}
                >
                  <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  <div
                    className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground"
                    style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
                  >
                    {STATUS_LABELS[status]}
                  </div>
                  <div className="mt-auto font-mono text-xs tabular-nums text-muted-foreground/70">
                    {items.length}
                  </div>
                </button>
              );
            }
            return (
              <Column
                key={status}
                status={status}
                items={items}
                isAdmin={isAdmin}
                onCollapse={
                  status === "NICHT_VERKAUFT" ? () => setLostExpanded(false) : undefined
                }
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Column({
  status,
  items,
  isAdmin,
  onCollapse,
}: {
  status: ClientStatus;
  items: KanbanClient[];
  isAdmin?: boolean;
  onCollapse?: () => void;
}) {
  const color = STATUS_COLORS[status];
  return (
    <div className="shrink-0 w-[280px] flex flex-col h-full bg-card border border-border/70 rounded-md overflow-hidden">
      <div
        className="shrink-0 px-3 pt-2.5 pb-2 flex items-center gap-2 border-b border-border/60"
        style={{ borderTop: `3px solid ${color}` }}
      >
        <span
          className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
          style={{ background: color }}
        />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/80 truncate">
          {STATUS_LABELS[status]}
        </span>
        <span className="ml-auto font-mono text-[10px] tabular-nums text-muted-foreground">
          {items.length}
        </span>
        {onCollapse && (
          <button
            type="button"
            onClick={onCollapse}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Spalte einklappen"
          >
            <ChevronRight className="h-3 w-3 rotate-180" />
          </button>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2">
        {items.length === 0 ? (
          <div
            className="h-full min-h-[100px] flex items-center justify-center font-mono text-xs"
            style={{ color }}
          >
            —
          </div>
        ) : (
          items.map((c) => (
            <ClientCard key={c.id} client={c} color={color} isAdmin={isAdmin} />
          ))
        )}
      </div>
    </div>
  );
}

function ClientCard({
  client,
  color,
  isAdmin,
}: {
  client: KanbanClient;
  color: string;
  isAdmin?: boolean;
}) {
  const today = startOfDay(new Date());
  const activeReminders = client.reminders.filter((r) => !r.completed);
  const hasOverdue = activeReminders.some((r) => startOfDay(r.date) < today);
  const hasToday = activeReminders.some(
    (r) => startOfDay(r.date).getTime() === today.getTime(),
  );
  const lead = calcLeadScore({
    ownership: client.ownership,
    constructionYear: client.constructionYear,
    buildingType: client.buildingType,
    heatingAge: client.heatingAge,
    annualKwhGas: client.annualKwhGas,
    annualLitersOil: client.annualLitersOil,
    wohnflaecheM2: client.wohnflaecheM2,
    incomeRange: client.incomeRange,
  });

  return (
    <Link
      href={`/clients/${client.id}`}
      className="block bg-card border border-border/70 rounded-md transition-all hover:-translate-y-px hover:border-foreground/40 cursor-grab active:cursor-grabbing"
      style={{ borderTop: `3px solid ${color}` }}
    >
      <div className="p-2.5 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              {client.salutation && (
                <span className="text-[9px] uppercase tracking-wide text-muted-foreground/70 shrink-0">
                  {client.salutation}
                </span>
              )}
              <span className="truncate text-sm font-semibold leading-tight">
                {client.firstName} {client.lastName}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="font-mono text-[10px] tabular-nums text-muted-foreground/80">
                {client.customerNumber}
              </span>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-[10px] text-muted-foreground truncate">
                {client.city}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {lead.tier === "hot" && (
              <Flame
                className="h-3 w-3"
                style={{ color: "var(--brand)" }}
                aria-label={`Hot ${lead.score}`}
              />
            )}
            {hasOverdue && (
              <span
                className="h-1.5 w-1.5 rounded-full bg-red-500"
                aria-label="Rückruf überfällig"
              />
            )}
            {!hasOverdue && hasToday && (
              <span
                className="h-1.5 w-1.5 rounded-full bg-amber-500"
                aria-label="Rückruf heute"
              />
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 font-mono text-[10px] tabular-nums">
          <ActivityCount icon={Phone} count={client.callsCount} title="Anrufe" />
          <ActivityCount icon={FileText} count={client.offersCount} title="Angebote" />
          <ActivityCount icon={Mail} count={client.emailsCount} title="E-Mails" />
          <span className="ml-auto text-muted-foreground/60">
            {formatRel(client.updatedAt)}
          </span>
        </div>

        <div className="flex items-center justify-between pt-1 mt-0.5 border-t border-border/40">
          <span className="text-[9px] uppercase tracking-wide text-muted-foreground/70 truncate">
            {isAdmin && client.assignedTo
              ? client.assignedTo.name
              : client.source === "website"
                ? "Webseite"
                : (client.source ?? "Manuell")}
          </span>
          {client.unsubscribed && (
            <span className="font-mono text-[8px] uppercase tracking-wider text-red-500/80 shrink-0">
              abgemeldet
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function ActivityCount({
  icon: Icon,
  count,
  title,
}: {
  icon: typeof Phone;
  count: number;
  title: string;
}) {
  return (
    <span
      className={`flex items-center gap-1 ${
        count > 0 ? "text-foreground/70" : "text-muted-foreground/40"
      }`}
      title={title}
    >
      <Icon className="h-3 w-3" />
      {count}
    </span>
  );
}

function formatRel(d: Date): string {
  const long = formatDistanceToNowStrict(d, { locale: de });
  const m = long.match(/(\d+)\s+(\S+)/);
  if (!m) return "·";
  const num = m[1];
  const u = m[2].toLowerCase();
  const letter = u.startsWith("minut")
    ? "m"
    : u.startsWith("stund")
      ? "h"
      : u.startsWith("tag")
        ? "T"
        : u.startsWith("monat")
          ? "Mo"
          : u.startsWith("jahr")
            ? "J"
            : "s";
  return `vor ${num}${letter}`;
}
