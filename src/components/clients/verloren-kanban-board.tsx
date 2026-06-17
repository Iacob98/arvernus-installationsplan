"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { de } from "date-fns/locale";
import { ArrowLeft, MessageSquare, MessageSquareOff, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { VerloreneClient } from "@/lib/actions/clients";
import { getVerloreneClients } from "@/lib/actions/clients";

const COLUMN_COLOR_MIT = "#52525b";
const COLUMN_COLOR_OHNE = "#a1a1aa";

interface Props {
  initialMitGrund: VerloreneClient[];
  initialOhneGrund: VerloreneClient[];
  isAdmin: boolean;
}

export function VerlorenKanbanBoard({
  initialMitGrund,
  initialOhneGrund,
  isAdmin,
}: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [mitGrund, setMitGrund] = useState(initialMitGrund);
  const [ohneGrund, setOhneGrund] = useState(initialOhneGrund);
  const [, startTransition] = useTransition();

  const total = mitGrund.length + ohneGrund.length;

  function handleSearchChange(value: string) {
    setSearch(value);
    startTransition(async () => {
      const q = value.trim();
      const result = await getVerloreneClients(q || undefined);
      setMitGrund(result.mitGrund);
      setOhneGrund(result.ohneGrund);
    });
  }

  const headerCounts = useMemo(
    () =>
      `${total} verloren · ${mitGrund.length} mit Grund · ${ohneGrund.length} ohne Grund`,
    [total, mitGrund.length, ohneGrund.length],
  );

  return (
    <div className="flex flex-col h-full">
      <header className="shrink-0 border-b border-border/60 bg-card px-3 sm:px-4 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
        <div className="flex items-baseline gap-2 sm:mr-auto">
          <Link
            href="/clients"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
            Zurück
          </Link>
          <h1 className="text-base font-semibold tracking-tight">
            Verlorene Kunden
          </h1>
          <span className="font-mono text-[11px] tabular-nums text-muted-foreground hidden sm:inline">
            {headerCounts}
          </span>
        </div>
        <div className="relative flex-1 sm:flex-initial sm:w-64">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Name, Nummer, Stadt…"
            className="h-9 sm:h-8 pl-7 bg-transparent border border-border rounded-md focus-visible:ring-0 focus-visible:border-[var(--brand)]"
          />
        </div>
      </header>

      <div className="sm:hidden border-b border-border/60 bg-muted/30 px-3 py-2 font-mono text-[11px] tabular-nums text-muted-foreground">
        {headerCounts}
      </div>

      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden">
        <div className="flex gap-3 h-full px-3 pt-3 pb-2 min-w-max sm:min-w-0 sm:w-full">
          <Column
            title="Mit Grund"
            color={COLUMN_COLOR_MIT}
            items={mitGrund}
            isAdmin={isAdmin}
            onClickClient={(id) => router.push(`/clients/${id}`)}
            emptyText="Keine Kunden mit Grund"
          />
          <Column
            title="Ohne Grund"
            color={COLUMN_COLOR_OHNE}
            items={ohneGrund}
            isAdmin={isAdmin}
            onClickClient={(id) => router.push(`/clients/${id}`)}
            emptyText="Keine Kunden ohne Grund"
          />
        </div>
      </div>
    </div>
  );
}

function Column({
  title,
  color,
  items,
  isAdmin,
  onClickClient,
  emptyText,
}: {
  title: string;
  color: string;
  items: VerloreneClient[];
  isAdmin: boolean;
  onClickClient: (id: string) => void;
  emptyText: string;
}) {
  const Icon = title === "Mit Grund" ? MessageSquare : MessageSquareOff;
  return (
    <div className="shrink-0 w-[320px] sm:w-1/2 sm:max-w-[480px] flex flex-col h-full bg-card border border-border/70 rounded-md overflow-hidden">
      <div
        className="shrink-0 px-3 pt-2.5 pb-2 flex items-center gap-2 border-b border-border/60"
        style={{ borderTop: `3px solid ${color}` }}
      >
        <Icon className="h-3 w-3 shrink-0" style={{ color }} />
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/80">
          {title}
        </span>
        <span className="ml-auto font-mono text-[10px] tabular-nums text-muted-foreground">
          {items.length}
        </span>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2">
        {items.length === 0 ? (
          <div
            className="h-full min-h-[100px] flex items-center justify-center font-mono text-xs"
            style={{ color }}
          >
            {emptyText}
          </div>
        ) : (
          items.map((c) => (
            <Card
              key={c.id}
              client={c}
              color={color}
              isAdmin={isAdmin}
              onClick={() => onClickClient(c.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function Card({
  client,
  color,
  isAdmin,
  onClick,
}: {
  client: VerloreneClient;
  color: string;
  isAdmin: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-card border border-border/70 rounded-md transition-all hover:-translate-y-px hover:border-foreground/40 cursor-pointer"
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
          <span
            className="font-mono text-[10px] tabular-nums text-muted-foreground/70 shrink-0"
            suppressHydrationWarning
          >
            vor {formatRel(client.updatedAt)}
          </span>
        </div>

        {client.verlustgrund && (
          <p className="text-[11px] italic text-muted-foreground leading-snug line-clamp-3">
            „{client.verlustgrund}&ldquo;
          </p>
        )}

        {isAdmin && client.assignedTo && (
          <div className="pt-1 mt-0.5 border-t border-border/40">
            <span className="text-[9px] uppercase tracking-wide text-muted-foreground/70">
              {client.assignedTo.name}
            </span>
          </div>
        )}
      </div>
    </button>
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
  return `${num}${letter}`;
}
