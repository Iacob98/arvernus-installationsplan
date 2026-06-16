/**
 * Sortiert Kunden nach letztem Anruf: noch nie angerufen (null) zuerst,
 * danach aufsteigend nach Anrufdatum (älteste zuerst). Für Array.sort.
 */
export function compareByLastCall(
  a: { lastCall: Date | null },
  b: { lastCall: Date | null },
): number {
  if (a.lastCall === null && b.lastCall === null) return 0;
  if (a.lastCall === null) return -1;
  if (b.lastCall === null) return 1;
  return a.lastCall.getTime() - b.lastCall.getTime();
}
