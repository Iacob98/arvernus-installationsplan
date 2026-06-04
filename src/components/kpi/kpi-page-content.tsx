"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
  CheckCircle2,
  Trophy,
  TrendingUp,
  Timer,
  Flame,
  Sparkles,
  Snowflake,
  PiggyBank,
  GitMerge,
} from "lucide-react";

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

  function setPeriod(period: KpiPeriod) {
    router.push(`/kpi?period=${period}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">KPI Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Produktivität des Teams je Zeitraum.
          </p>
        </div>
        <Tabs value={data.period} onValueChange={(v) => setPeriod(v as KpiPeriod)}>
          <TabsList>
            {(Object.keys(PERIOD_LABELS) as KpiPeriod[]).map((p) => (
              <TabsTrigger key={p} value={p}>
                {PERIOD_LABELS[p]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
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
          icon={CheckCircle2}
          label="Akzeptiert"
          value={data.totals.offersAccepted}
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
          icon={PiggyBank}
          label="Förderung-Anteil"
          value={`${data.totals.foerderungAnteilPct} %`}
          sub="KfW aktiv"
        />
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
                  <TableHead>Mitarbeiter</TableHead>
                  <TableHead>Rolle</TableHead>
                  <TableHead className="text-right">Kunden</TableHead>
                  <TableHead className="text-right">Anrufe</TableHead>
                  <TableHead className="text-right">Erreicht</TableHead>
                  <TableHead className="text-right">Kunden angerufen</TableHead>
                  <TableHead className="text-right">Ø Anrufe/Kunde</TableHead>
                  <TableHead className="text-right">Angebote</TableHead>
                  <TableHead className="text-right">Akzeptiert</TableHead>
                  <TableHead className="text-right">Verkauft</TableHead>
                  <TableHead className="text-right">Konversion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.managers.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      className="py-10 text-center text-muted-foreground"
                    >
                      Keine Daten im Zeitraum.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.managers.map((m) => (
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
                      <TableCell className="text-right">{m.offersAccepted}</TableCell>
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
