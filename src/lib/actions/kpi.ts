"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import type { Role } from "@prisma/client";
import { calcLeadScore } from "@/lib/lead-scoring";

export type KpiPeriod = "today" | "week" | "month" | "all";

export type ManagerKpi = {
  userId: string;
  name: string;
  role: Role;
  assignedClients: number;
  callsTotal: number;
  callsReached: number;
  clientsCalled: number;
  avgCallsPerClient: number;
  offersSent: number;
  offersAccepted: number;
  clientsSold: number;
  conversionPct: number;
};

export type KpiTotals = {
  managers: number;
  assignedClients: number;
  callsTotal: number;
  callsReached: number;
  clientsCalled: number;
  offersSent: number;
  offersAccepted: number;
  clientsSold: number;
  conversionPct: number;
  /** Schnitt Stunden vom Kunden-Anlage bis zum ersten Anruf */
  avgFirstCallHours: number | null;
  /** Lead-to-Quote: Anteil Kunden im Zeitraum, die mindestens ein Angebot erhalten haben */
  leadToQuotePct: number;
  /** Quote-to-Close: Anteil versendeter Angebote, deren Kunde verkauft wurde */
  quoteToClosePct: number;
  /** Anteil der versendeten Angebote mit KfW-Förderung */
  foerderungAnteilPct: number;
  /** Hot/Warm/Cold-Verteilung (Snapshot — ignoriert Periode) */
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
};

export type KpiResult = {
  period: KpiPeriod;
  since: string | null;
  until: string | null;
  totals: KpiTotals;
  managers: ManagerKpi[];
};

function sinceFor(period: KpiPeriod): Date | null {
  if (period === "all") return null;
  const d = new Date();
  if (period === "today") {
    d.setHours(0, 0, 0, 0);
  } else if (period === "week") {
    d.setDate(d.getDate() - 7);
  } else if (period === "month") {
    d.setDate(d.getDate() - 30);
  }
  return d;
}

function parseDate(value: string | undefined, endOfDay = false): Date | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  if (endOfDay) d.setHours(23, 59, 59, 999);
  else d.setHours(0, 0, 0, 0);
  return d;
}

function pct(numer: number, denom: number): number {
  if (!denom) return 0;
  return Math.round((numer / denom) * 1000) / 10;
}

export async function getKpi(
  period: KpiPeriod,
  options?: { from?: string; to?: string },
): Promise<KpiResult> {
  const session = await requireAuth();
  const isAdmin = session.user.role === "ADMIN";
  const restrictUserId = isAdmin ? null : session.user.id;

  const customFrom = parseDate(options?.from);
  const customTo = parseDate(options?.to, true);
  const hasCustomRange = customFrom !== null || customTo !== null;
  const since = hasCustomRange ? customFrom : sinceFor(period);
  const until = hasCustomRange ? customTo : null;

  const rangeFilter = (field: "calledAt" | "createdAt" | "updatedAt") => {
    const cond: { gte?: Date; lte?: Date } = {};
    if (since) cond.gte = since;
    if (until) cond.lte = until;
    return Object.keys(cond).length > 0 ? { [field]: cond } : {};
  };

  const callsDateWhere = rangeFilter("calledAt");
  const offersDateWhere = rangeFilter("createdAt");
  const updatedDateWhere = rangeFilter("updatedAt");

  const [
    users,
    callsByUser,
    reachedByUser,
    distinctClientsCalled,
    offersByUser,
    offersAcceptedByUser,
    clientsSoldByUser,
    assignedByUser,
  ] = await Promise.all([
    db.user.findMany({
      where: restrictUserId
        ? { id: restrictUserId }
        : {
            active: true,
            OR: [
              { assignedClients: { some: {} } },
              { callLogs: { some: {} } },
              { offers: { some: {} } },
            ],
          },
      select: { id: true, name: true, role: true },
      orderBy: { name: "asc" },
    }),
    db.callLog.groupBy({
      by: ["userId"],
      where: { ...callsDateWhere, ...(restrictUserId ? { userId: restrictUserId } : {}) },
      _count: { _all: true },
    }),
    db.callLog.groupBy({
      by: ["userId"],
      where: {
        ...callsDateWhere,
        outcome: "REACHED",
        ...(restrictUserId ? { userId: restrictUserId } : {}),
      },
      _count: { _all: true },
    }),
    db.callLog.findMany({
      where: { ...callsDateWhere, ...(restrictUserId ? { userId: restrictUserId } : {}) },
      distinct: ["userId", "clientId"],
      select: { userId: true, clientId: true },
    }),
    db.offer.groupBy({
      by: ["createdById"],
      where: {
        ...offersDateWhere,
        status: { not: "DRAFT" },
        ...(restrictUserId ? { createdById: restrictUserId } : {}),
      },
      _count: { _all: true },
    }),
    db.offer.groupBy({
      by: ["createdById"],
      where: {
        ...updatedDateWhere,
        status: "ACCEPTED",
        ...(restrictUserId ? { createdById: restrictUserId } : {}),
      },
      _count: { _all: true },
    }),
    db.client.groupBy({
      by: ["assignedToId"],
      where: {
        ...updatedDateWhere,
        status: "VERKAUFT",
        ...(restrictUserId ? { assignedToId: restrictUserId } : {}),
      },
      _count: { _all: true },
    }),
    db.client.groupBy({
      by: ["assignedToId"],
      where: restrictUserId ? { assignedToId: restrictUserId } : {},
      _count: { _all: true },
    }),
  ]);

  function mapById<T extends { _count: { _all: number } }>(
    rows: T[],
    pickId: (row: T) => string | null,
  ): Map<string, number> {
    const m = new Map<string, number>();
    for (const r of rows) {
      const id = pickId(r);
      if (!id) continue;
      m.set(id, r._count._all);
    }
    return m;
  }

  const calls = mapById(callsByUser, (r) => r.userId);
  const reached = mapById(reachedByUser, (r) => r.userId);
  const offers = mapById(offersByUser, (r) => r.createdById);
  const offersAccepted = mapById(offersAcceptedByUser, (r) => r.createdById);
  const sold = mapById(clientsSoldByUser, (r) => r.assignedToId);
  const assigned = mapById(assignedByUser, (r) => r.assignedToId);

  const calledByUser = new Map<string, number>();
  for (const row of distinctClientsCalled) {
    calledByUser.set(row.userId, (calledByUser.get(row.userId) ?? 0) + 1);
  }

  const managers: ManagerKpi[] = users.map((u) => {
    const callsTotal = calls.get(u.id) ?? 0;
    const callsReached = reached.get(u.id) ?? 0;
    const clientsCalled = calledByUser.get(u.id) ?? 0;
    const offersSent = offers.get(u.id) ?? 0;
    const offersAccepted_ = offersAccepted.get(u.id) ?? 0;
    const clientsSold = sold.get(u.id) ?? 0;
    const assignedClients = assigned.get(u.id) ?? 0;
    return {
      userId: u.id,
      name: u.name,
      role: u.role,
      assignedClients,
      callsTotal,
      callsReached,
      clientsCalled,
      avgCallsPerClient: clientsCalled ? Math.round((callsTotal / clientsCalled) * 10) / 10 : 0,
      offersSent,
      offersAccepted: offersAccepted_,
      clientsSold,
      conversionPct: pct(clientsSold, assignedClients),
    };
  });

  const totals: KpiTotals = managers.reduce<KpiTotals>(
    (acc, m) => ({
      ...acc,
      managers: acc.managers + 1,
      assignedClients: acc.assignedClients + m.assignedClients,
      callsTotal: acc.callsTotal + m.callsTotal,
      callsReached: acc.callsReached + m.callsReached,
      clientsCalled: acc.clientsCalled + m.clientsCalled,
      offersSent: acc.offersSent + m.offersSent,
      offersAccepted: acc.offersAccepted + m.offersAccepted,
      clientsSold: acc.clientsSold + m.clientsSold,
    }),
    {
      managers: 0,
      assignedClients: 0,
      callsTotal: 0,
      callsReached: 0,
      clientsCalled: 0,
      offersSent: 0,
      offersAccepted: 0,
      clientsSold: 0,
      conversionPct: 0,
      avgFirstCallHours: null,
      leadToQuotePct: 0,
      quoteToClosePct: 0,
      foerderungAnteilPct: 0,
      hotLeads: 0,
      warmLeads: 0,
      coldLeads: 0,
    },
  );
  totals.conversionPct = pct(totals.clientsSold, totals.assignedClients);

  // --- Erweiterte Metriken (Team-Ebene) ---
  const userIds = managers.map((m) => m.userId);
  const userFilter = restrictUserId ? { in: [restrictUserId] } : { in: userIds };

  const [newClients, clientsWithOffer, sentOffers, foerderOffers, leadScoreSource] =
    await Promise.all([
      db.client.count({
        where: {
          ...rangeFilter("createdAt"),
          assignedToId: userFilter,
        },
      }),
      db.client.count({
        where: {
          ...rangeFilter("createdAt"),
          assignedToId: userFilter,
          offers: { some: { status: { not: "DRAFT" } } },
        },
      }),
      db.offer.count({
        where: {
          ...rangeFilter("createdAt"),
          createdById: userFilter,
          status: { not: "DRAFT" },
        },
      }),
      db.offer.findMany({
        where: {
          ...rangeFilter("createdAt"),
          createdById: userFilter,
          status: { not: "DRAFT" },
        },
        select: { kfwFoerderung: true },
      }),
      db.client.findMany({
        where: { assignedToId: userFilter },
        select: {
          ownership: true,
          constructionYear: true,
          buildingType: true,
          heatingAge: true,
          annualKwhGas: true,
          annualLitersOil: true,
          wohnflaecheM2: true,
          incomeRange: true,
        },
        take: 1000,
      }),
    ]);

  totals.leadToQuotePct = pct(clientsWithOffer, newClients);
  totals.quoteToClosePct = pct(totals.clientsSold, sentOffers);

  const withFoerd = foerderOffers.filter((o) => {
    const k = o.kfwFoerderung as { enabled?: boolean } | null;
    return k?.enabled === true;
  }).length;
  totals.foerderungAnteilPct = pct(withFoerd, foerderOffers.length);

  // Avg time-to-first-call: ищем для каждого клиента первый CallLog
  const firstCalls = await db.client.findMany({
    where: {
      assignedToId: userFilter,
      callLogs: { some: {} },
    },
    select: {
      createdAt: true,
      callLogs: {
        orderBy: { calledAt: "asc" },
        take: 1,
        select: { calledAt: true },
      },
    },
    take: 500,
  });
  if (firstCalls.length > 0) {
    const sumHours = firstCalls.reduce((s, c) => {
      const first = c.callLogs[0]?.calledAt;
      if (!first) return s;
      const diffH = (first.getTime() - c.createdAt.getTime()) / 3_600_000;
      return s + Math.max(0, diffH);
    }, 0);
    totals.avgFirstCallHours = Math.round((sumHours / firstCalls.length) * 10) / 10;
  }

  // Lead-Score-Verteilung
  for (const c of leadScoreSource) {
    const r = calcLeadScore({
      ownership: c.ownership,
      constructionYear: c.constructionYear,
      buildingType: c.buildingType,
      heatingAge: c.heatingAge,
      annualKwhGas: c.annualKwhGas,
      annualLitersOil: c.annualLitersOil,
      wohnflaecheM2: c.wohnflaecheM2,
      incomeRange: c.incomeRange,
    });
    if (r.tier === "hot") totals.hotLeads++;
    else if (r.tier === "warm") totals.warmLeads++;
    else totals.coldLeads++;
  }

  return {
    period,
    since: since ? since.toISOString() : null,
    until: until ? until.toISOString() : null,
    totals,
    managers,
  };
}
