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

type InboxSortable = {
  unreadInboundCount: number;
  lastInboundAt: Date | null;
  lastCall: Date | null;
};

/**
 * Pipeline-Sortierung pro Spalte: Kunden mit ungelesenen eingegangenen Mails
 * zuerst (neueste Antwort oben), danach erst nach letztem Anruf
 * (compareByLastCall). Sonst gehen neue Antworten in der Anruf-Sortierung
 * unter — die reine compareByLastCall-Reihenfolge "versteckt" neue Mails.
 */
export function compareByInboxThenCall(
  a: InboxSortable,
  b: InboxSortable,
): number {
  const aUnread = a.unreadInboundCount > 0 ? 1 : 0;
  const bUnread = b.unreadInboundCount > 0 ? 1 : 0;
  if (aUnread !== bUnread) return bUnread - aUnread;

  if (aUnread === 1 && bUnread === 1) {
    const aT = a.lastInboundAt?.getTime() ?? 0;
    const bT = b.lastInboundAt?.getTime() ?? 0;
    if (aT !== bT) return bT - aT;
  }

  return compareByLastCall(a, b);
}
