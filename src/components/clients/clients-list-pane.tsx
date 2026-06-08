"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startOfDay, formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { ClientStatus } from "@prisma/client";
import {
  Flame,
  AlertCircle,
  Search,
  SlidersHorizontal,
  Plus,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calcLeadScore } from "@/lib/lead-scoring";

export type ClientRowData = {
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
};

const STATUS_ORDER: ClientStatus[] = [
  "NEU",
  "IN_BEARBEITUNG",
  "ANGERUFEN",
  "ANGEBOT_VERSENDET",
  "VERKAUFT",
  "NICHT_VERKAUFT",
];

const STATUS_LABELS: Record<ClientStatus, string> = {
  NEU: "Neu",
  IN_BEARBEITUNG: "In Bearbeitung",
  ANGERUFEN: "Angerufen",
  ANGEBOT_VERSENDET: "Angebot versendet",
  VERKAUFT: "Verkauft",
  NICHT_VERKAUFT: "Verloren",
};

// Folder-tab color per status — used as the left edge of each row.
const STATUS_COLORS: Record<ClientStatus, string> = {
  NEU: "#7c3aed",
  IN_BEARBEITUNG: "#0284c7",
  ANGERUFEN: "#06b6d4",
  ANGEBOT_VERSENDET: "#d97706",
  VERKAUFT: "#059669",
  NICHT_VERKAUFT: "#71717a",
};

interface Props {
  clients: ClientRowData[];
  selectedId?: string | null;
  search: string;
  setSearch: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  assignedFilter?: string;
  setAssignedFilter?: (v: string) => void;
  users?: { id: string; name: string }[];
  isAdmin?: boolean;
  totalCount: number;
}

export function ClientsListPane({
  clients,
  selectedId,
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  assignedFilter,
  setAssignedFilter,
  users,
  isAdmin,
  totalCount,
}: Props) {
  const router = useRouter();
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [collapsed, setCollapsed] = useState<Set<ClientStatus>>(new Set());
  const [cursor, setCursor] = useState<number | null>(null);

  const grouped = useMemo(() => {
    const g: Record<ClientStatus, ClientRowData[]> = {
      NEU: [],
      IN_BEARBEITUNG: [],
      ANGERUFEN: [],
      ANGEBOT_VERSENDET: [],
      VERKAUFT: [],
      NICHT_VERKAUFT: [],
    };
    for (const c of clients) g[c.status]?.push(c);
    return g;
  }, [clients]);

  const visibleFlat = useMemo(() => {
    const out: ClientRowData[] = [];
    for (const s of STATUS_ORDER) {
      if (collapsed.has(s)) continue;
      out.push(...grouped[s]);
    }
    return out;
  }, [grouped, collapsed]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      const inInput = t.tagName === "INPUT" || t.tagName === "TEXTAREA";
      if (e.key === "/" && !inInput) {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (inInput && e.key === "Escape") {
        searchRef.current?.blur();
        return;
      }
      if (inInput) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setCursor((c) =>
          c === null ? 0 : Math.min(visibleFlat.length - 1, c + 1),
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setCursor((c) => (c === null ? 0 : Math.max(0, c - 1)));
      } else if (e.key === "Enter" && cursor !== null) {
        e.preventDefault();
        const c = visibleFlat[cursor];
        if (c) router.push(`/clients?selected=${c.id}`, { scroll: false });
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [visibleFlat, cursor, router]);

  useEffect(() => {
    if (cursor === null) return;
    const el = listRef.current?.querySelector(`[data-cursor="${cursor}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  const filtersDirty =
    statusFilter !== "ALL" ||
    (assignedFilter && assignedFilter !== "ALL") ||
    search.trim().length > 0;

  return (
    <div className="flex flex-col h-full bg-card text-sm">
      {/* TOOLBAR */}
      <div className="shrink-0 border-b">
        <div className="px-3 pt-2 pb-1 flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Kunden
            </span>
            <span className="font-mono text-xs tabular-nums">
              {clients.length}
              <span className="text-muted-foreground"> / {totalCount}</span>
            </span>
          </div>
          <Button
            asChild
            size="sm"
            className="h-7 text-xs"
            style={{
              background: "var(--brand)",
              color: "var(--brand-foreground)",
            }}
          >
            <Link href="/clients/new">
              <Plus className="h-3 w-3 mr-1" /> Neu
            </Link>
          </Button>
        </div>
        <div className="px-3 pb-2 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-1 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name, Nummer, Stadt…"
              className="h-8 pl-6 pr-7 text-sm bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:shadow-none focus-visible:border-[var(--brand)]"
            />
            <kbd className="absolute right-1 top-1/2 -translate-y-1/2 font-mono text-[9px] uppercase text-muted-foreground/60 border border-border/60 rounded px-1 py-0.5 bg-muted/40 pointer-events-none">
              /
            </kbd>
          </div>
          <FilterPopover
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            assignedFilter={assignedFilter}
            setAssignedFilter={setAssignedFilter}
            users={users}
            isAdmin={isAdmin}
            active={filtersDirty}
          />
        </div>
      </div>

      {/* LIST */}
      <div ref={listRef} className="flex-1 overflow-y-auto" tabIndex={-1}>
        {clients.length === 0 ? (
          <EmptyState filtered={filtersDirty} />
        ) : (
          STATUS_ORDER.map((status) => {
            const group = grouped[status];
            if (group.length === 0) return null;
            const isCollapsed = collapsed.has(status);
            const idxStart = visibleFlat.findIndex((c) => c === group[0]);
            return (
              <section key={status}>
                <button
                  type="button"
                  onClick={() =>
                    setCollapsed((p) => {
                      const n = new Set(p);
                      if (n.has(status)) n.delete(status);
                      else n.add(status);
                      return n;
                    })
                  }
                  className="w-full sticky top-0 z-10 bg-card/95 backdrop-blur flex items-center gap-1.5 px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.16em] hover:bg-muted/40 border-b border-border/40"
                >
                  {isCollapsed ? (
                    <ChevronRight className="h-3 w-3" />
                  ) : (
                    <ChevronDown className="h-3 w-3" />
                  )}
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full"
                    style={{ background: STATUS_COLORS[status] }}
                  />
                  <span className="text-foreground/80">
                    {STATUS_LABELS[status]}
                  </span>
                  <span className="ml-auto tabular-nums text-muted-foreground/70">
                    {group.length}
                  </span>
                </button>
                {!isCollapsed &&
                  group.map((client, i) => (
                    <ClientListRow
                      key={client.id}
                      client={client}
                      statusColor={STATUS_COLORS[status]}
                      selected={selectedId === client.id}
                      cursor={cursor === idxStart + i}
                      cursorIndex={idxStart + i}
                    />
                  ))}
              </section>
            );
          })
        )}
      </div>

      {/* FOOTER kbd hints */}
      <div className="shrink-0 border-t px-3 py-1.5 flex items-center justify-end gap-3 font-mono text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd> navigieren
        </span>
        <span className="flex items-center gap-1">
          <Kbd>↵</Kbd> öffnen
        </span>
        <span className="flex items-center gap-1">
          <Kbd>/</Kbd> suchen
        </span>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="border border-border/60 rounded px-1 py-px text-[9px] uppercase bg-muted/40 leading-none">
      {children}
    </kbd>
  );
}

function ClientListRow({
  client,
  statusColor,
  selected,
  cursor,
  cursorIndex,
}: {
  client: ClientRowData;
  statusColor: string;
  selected: boolean;
  cursor: boolean;
  cursorIndex: number;
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

  const folderTab: React.CSSProperties = selected
    ? { borderLeft: "4px solid var(--brand)" }
    : cursor
      ? { borderLeft: "4px solid var(--brand)", opacity: 0.85 }
      : { borderLeft: `3px solid ${statusColor}` };

  const baseRowClasses =
    "items-center gap-2 h-9 pr-2 border-b border-border/30 transition-colors";

  return (
    <>
      {/* XL: inner navigation via ?selected= */}
      <Link
        href={`/clients?selected=${client.id}`}
        scroll={false}
        replace
        data-cursor={cursorIndex}
        className={`hidden xl:flex ${baseRowClasses} pl-2 ${
          selected
            ? "bg-[var(--brand-muted)]"
            : cursor
              ? "bg-[var(--brand-muted)]/60"
              : "hover:bg-[var(--brand-muted)]/40"
        }`}
        style={folderTab}
      >
        <RowBody
          client={client}
          lead={lead}
          hasOverdue={hasOverdue}
          hasToday={hasToday}
        />
      </Link>
      {/* < XL: full-page navigation */}
      <Link
        href={`/clients/${client.id}`}
        className={`flex xl:hidden ${baseRowClasses} pl-2 h-10 hover:bg-muted/30`}
        style={folderTab}
      >
        <RowBody
          client={client}
          lead={lead}
          hasOverdue={hasOverdue}
          hasToday={hasToday}
        />
      </Link>
    </>
  );
}

function RowBody({
  client,
  lead,
  hasOverdue,
  hasToday,
}: {
  client: ClientRowData;
  lead: ReturnType<typeof calcLeadScore>;
  hasOverdue: boolean;
  hasToday: boolean;
}) {
  return (
    <>
      <div className="min-w-0 flex-1 flex items-center gap-1.5">
        {client.salutation && (
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground/70 shrink-0">
            {client.salutation}
          </span>
        )}
        <span className="truncate font-medium">
          {client.firstName} {client.lastName}
        </span>
        {lead.tier === "hot" && (
          <Flame
            className="h-3 w-3 shrink-0"
            style={{ color: "var(--brand)" }}
            aria-label={`Hot ${lead.score}`}
          />
        )}
        {hasOverdue && (
          <AlertCircle
            className="h-3 w-3 shrink-0 text-red-500"
            aria-label="Rückruf überfällig"
          />
        )}
        {!hasOverdue && hasToday && (
          <AlertCircle
            className="h-3 w-3 shrink-0 text-amber-500"
            aria-label="Rückruf heute"
          />
        )}
        {client.unsubscribed && (
          <span className="font-mono text-[9px] uppercase tracking-wider text-red-500/80 ml-1 shrink-0">
            abgemeldet
          </span>
        )}
      </div>
      <span className="font-mono text-[11px] tabular-nums text-muted-foreground/80 shrink-0">
        {client.customerNumber}
      </span>
      <span className="hidden 2xl:inline truncate max-w-[90px] text-[11px] text-muted-foreground/70 shrink-0">
        {client.city}
      </span>
      <span className="font-mono text-[10px] tabular-nums text-muted-foreground/60 shrink-0 w-12 text-right">
        {compactRelative(client.updatedAt)}
      </span>
    </>
  );
}

function compactRelative(d: Date): string {
  const long = formatDistanceToNow(d, { locale: de });
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
            : u.startsWith("sekund")
              ? "s"
              : u[0];
  return `${num}${letter}`;
}

function FilterPopover({
  statusFilter,
  setStatusFilter,
  assignedFilter,
  setAssignedFilter,
  users,
  isAdmin,
  active,
}: {
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  assignedFilter?: string;
  setAssignedFilter?: (v: string) => void;
  users?: { id: string; name: string }[];
  isAdmin?: boolean;
  active: boolean;
}) {
  const options = [
    { value: "ALL", label: "Alle" },
    ...STATUS_ORDER.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
  ];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2 gap-1 text-xs"
          style={
            active
              ? { borderColor: "var(--brand)", color: "var(--brand)" }
              : undefined
          }
        >
          <SlidersHorizontal className="h-3 w-3" />
          {active && (
            <span
              className="ml-1 h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--brand)" }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0">
        <div className="p-3 border-b">
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
            Status
          </div>
          <div className="space-y-0.5">
            {options.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setStatusFilter(o.value)}
                className={`w-full text-left px-2 py-1 text-xs rounded flex items-center gap-2 ${
                  statusFilter === o.value
                    ? "bg-[var(--brand-muted)] text-[var(--brand)] font-medium"
                    : "hover:bg-muted/40"
                }`}
              >
                {o.value !== "ALL" ? (
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full"
                    style={{
                      background: STATUS_COLORS[o.value as ClientStatus],
                    }}
                  />
                ) : (
                  <span className="inline-block w-1.5 h-1.5" />
                )}
                {o.label}
              </button>
            ))}
          </div>
        </div>
        {isAdmin && users && users.length > 0 && setAssignedFilter && (
          <div className="p-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground mb-2">
              Mitarbeiter
            </div>
            <Select
              value={assignedFilter ?? "ALL"}
              onValueChange={setAssignedFilter}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Alle</SelectItem>
                <SelectItem value="UNASSIGNED">Nicht zugewiesen</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

function EmptyState({ filtered }: { filtered: boolean }) {
  return (
    <div className="p-8 text-center">
      <p className="text-sm text-muted-foreground">
        {filtered ? "Keine Treffer." : "Noch keine Kunden."}
      </p>
      {filtered && (
        <p className="font-mono text-[10px] text-muted-foreground/60 mt-3">
          Tipp: <Kbd>/</Kbd> für Suche, <Kbd>↑</Kbd>
          <Kbd>↓</Kbd> zum Blättern.
        </p>
      )}
    </div>
  );
}
