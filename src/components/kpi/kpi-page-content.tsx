"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { Role } from "@prisma/client";
import type { KpiResult, KpiPeriod } from "@/lib/actions/kpi";
import {
  Phone,
  PhoneCall,
  FileText,
  Trophy,
  TrendingUp,
  Timer,
  Flame,
  Sparkles,
  Snowflake,
  GitMerge,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from "lucide-react";
import type { ManagerKpi } from "@/lib/actions/kpi";

type SortKey =
  | "name"
  | "role"
  | "assignedClients"
  | "callsTotal"
  | "callsReached"
  | "clientsCalled"
  | "avgCallsPerClient"
  | "offersSent"
  | "clientsSold"
  | "conversionPct";

type SortDir = "asc" | "desc";

const PERIOD_LABELS: Record<KpiPeriod, string> = {
  today: "Heute",
  week: "7 Tage",
  month: "30 Tage",
  all: "Gesamt",
};

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Admin",
  MANAGER: "Manager",
  TECHNICIAN: "Techniker",
  VIEWER: "Viewer",
};

export function KpiPageContent({ data }: { data: KpiResult }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlFrom = searchParams.get("from") ?? "";
  const urlTo = searchParams.get("to") ?? "";
  const hasCustomRange = !!(urlFrom || urlTo);
  const [from, setFrom] = useState(urlFrom);
  const [to, setTo] = useState(urlTo);
  const [sortKey, setSortKey] = useState<SortKey>("clientsSold");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    setFrom(urlFrom);
    setTo(urlTo);
  }, [urlFrom, urlTo]);

  function setPeriod(period: KpiPeriod) {
    router.push(`/kpi?period=${period}`);
  }

  function applyRange() {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    router.push(`/kpi${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function clearRange() {
    setFrom("");
    setTo("");
    router.push(`/kpi?period=${data.period}`);
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "name" || key === "role" ? "asc" : "desc");
    }
  }

  const sortedManagers = useMemo(() => {
    const arr = [...data.managers];
    arr.sort((a, b) => {
      const av = a[sortKey as keyof ManagerKpi];
      const bv = b[sortKey as keyof ManagerKpi];
      let cmp = 0;
      if (typeof av === "number" && typeof bv === "number") cmp = av - bv;
      else cmp = String(av).localeCompare(String(bv), "de");
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [data.managers, sortKey, sortDir]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">KPI Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Produktivität des Teams je Zeitraum.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
          <Tabs
            value={hasCustomRange ? "" : data.period}
            onValueChange={(v) => setPeriod(v as KpiPeriod)}
          >
            <TabsList>
              {(Object.keys(PERIOD_LABELS) as KpiPeriod[]).map((p) => (
                <TabsTrigger key={p} value={p}>
                  {PERIOD_LABELS[p]}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="flex items-end gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Von</Label>
              <Input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-8 w-36"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Bis</Label>
              <Input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-8 w-36"
              />
            </div>
            <Button size="sm" onClick={applyRange} disabled={!from && !to}>
              Übernehmen
            </Button>
            {hasCustomRange && (
              <Button size="sm" variant="ghost" onClick={clearRange}>
                Zurücksetzen
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <TotalCard icon={Phone} label="Anrufe" value={data.totals.callsTotal} />
        <TotalCard
          icon={PhoneCall}
          label="Erreicht"
          value={data.totals.callsReached}
          sub={
            data.totals.callsTotal > 0
              ? `${Math.round((data.totals.callsReached / data.totals.callsTotal) * 100)} %`
              : undefined
          }
        />
        <TotalCard
          icon={FileText}
          label="Angebote"
          value={data.totals.offersSent}
        />
        <TotalCard
          icon={Trophy}
          label="Verkauft"
          value={data.totals.clientsSold}
        />
        <TotalCard
          icon={TrendingUp}
          label="Konversion"
          value={`${data.totals.conversionPct} %`}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <TotalCard
          icon={Flame}
          label="Hot Leads"
          value={data.totals.hotLeads}
          sub={
            <>
              <Sparkles className="inline h-3 w-3 mx-1 text-amber-500" />
              {data.totals.warmLeads} warm{" "}
              <Snowflake className="inline h-3 w-3 mx-1 text-sky-500" />
              {data.totals.coldLeads} cold
            </>
          }
        />
        <TotalCard
          icon={Timer}
          label="Ø Time-to-first-call"
          value={
            data.totals.avgFirstCallHours === null
              ? "—"
              : `${data.totals.avgFirstCallHours} h`
          }
          sub="Ziel < 4 h"
        />
        <TotalCard
          icon={GitMerge}
          label="Lead → Quote"
          value={`${data.totals.leadToQuotePct} %`}
          sub="Benchmark 40–55 %"
        />
        <TotalCard
          icon={Trophy}
          label="Quote → Close"
          value={`${data.totals.quoteToClosePct} %`}
          sub="Benchmark 25–35 %"
        />
        <TotalCard
          icon={Phone}
          label="Ø Anrufe/Kunde"
          value={
            data.totals.clientsCalled > 0
              ? Math.round(
                  (data.totals.callsTotal / data.totals.clientsCalled) * 10,
                ) / 10
              : "—"
          }
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mitarbeiter</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead label="Mitarbeiter" k="name" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                  <SortableHead label="Rolle" k="role" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} />
                  <SortableHead label="Kunden" k="assignedClients" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                  <SortableHead label="Anrufe" k="callsTotal" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                  <SortableHead label="Erreicht" k="callsReached" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                  <SortableHead label="Kunden angerufen" k="clientsCalled" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                  <SortableHead label="Ø Anrufe/Kunde" k="avgCallsPerClient" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                  <SortableHead label="Angebote" k="offersSent" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                  <SortableHead label="Verkauft" k="clientsSold" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                  <SortableHead label="Konversion" k="conversionPct" sortKey={sortKey} sortDir={sortDir} onClick={toggleSort} align="right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedManagers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="py-10 text-center text-muted-foreground"
                    >
                      Keine Daten im Zeitraum.
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedManagers.map((m) => (
                    <TableRow key={m.userId}>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {ROLE_LABELS[m.role]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{m.assignedClients}</TableCell>
                      <TableCell className="text-right">{m.callsTotal}</TableCell>
                      <TableCell className="text-right">{m.callsReached}</TableCell>
                      <TableCell className="text-right">{m.clientsCalled}</TableCell>
                      <TableCell className="text-right">
                        {m.avgCallsPerClient || "—"}
                      </TableCell>
                      <TableCell className="text-right">{m.offersSent}</TableCell>
                      <TableCell className="text-right font-medium">
                        {m.clientsSold}
                      </TableCell>
                      <TableCell className="text-right">
                        <ConversionCell pct={m.conversionPct} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SortableHead({
  label,
  k,
  sortKey,
  sortDir,
  onClick,
  align,
}: {
  label: string;
  k: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onClick: (k: SortKey) => void;
  align?: "right";
}) {
  const active = sortKey === k;
  const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead className={align === "right" ? "text-right" : ""}>
      <button
        type="button"
        onClick={() => onClick(k)}
        className={`inline-flex items-center gap-1 hover:text-foreground transition-colors ${
          active ? "text-foreground font-semibold" : "text-muted-foreground"
        } ${align === "right" ? "ml-auto" : ""}`}
      >
        {label}
        <Icon className="h-3 w-3" />
      </button>
    </TableHead>
  );
}

function TotalCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Phone;
  label: string;
  value: number | string;
  sub?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </div>
        <div className="text-2xl font-bold mt-1">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function ConversionCell({ pct }: { pct: number }) {
  const color =
    pct >= 20
      ? "text-green-600 dark:text-green-400"
      : pct >= 10
        ? "text-orange-500"
        : "text-muted-foreground";
  return <span className={`font-medium ${color}`}>{pct} %</span>;
}
