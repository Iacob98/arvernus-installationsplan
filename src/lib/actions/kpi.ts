"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import type { Role } from "@prisma/client";

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
};

export type KpiResult = {
  period: KpiPeriod;
  since: string | null;
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

function pct(numer: number, denom: number): number {
  if (!denom) return 0;
  return Math.round((numer / denom) * 1000) / 10;
}

export async function getKpi(period: KpiPeriod): Promise<KpiResult> {
  const session = await requireAuth();
  const isAdmin = session.user.role === "ADMIN";
  const restrictUserId = isAdmin ? null : session.user.id;
  const since = sinceFor(period);

  const callsDateWhere = since ? { calledAt: { gte: since } } : {};
  const offersDateWhere = since ? { createdAt: { gte: since } } : {};
  const updatedDateWhere = since ? { updatedAt: { gte: since } } : {};

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
      managers: acc.managers + 1,
      assignedClients: acc.assignedClients + m.assignedClients,
      callsTotal: acc.callsTotal + m.callsTotal,
      callsReached: acc.callsReached + m.callsReached,
      clientsCalled: acc.clientsCalled + m.clientsCalled,
      offersSent: acc.offersSent + m.offersSent,
      offersAccepted: acc.offersAccepted + m.offersAccepted,
      clientsSold: acc.clientsSold + m.clientsSold,
      conversionPct: 0,
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
    },
  );
  totals.conversionPct = pct(totals.clientsSold, totals.assignedClients);

  return {
    period,
    since: since ? since.toISOString() : null,
    totals,
    managers,
  };
}
