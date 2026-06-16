# Letzter Anruf auf Kanban-Karten + Sortierung

**Datum:** 2026-06-16
**Status:** Genehmigt (Design)
**Branch:** redesign-clients

## Problem / Ziel

Auf der Pipeline-Kanban-Doska (`/clients`) zeigen die Client-Karten Aktivität
(Anzahl Anrufe/Angebote/E-Mails) und ein relatives `updatedAt`, aber NICHT, wann
der Kunde zuletzt angerufen wurde. Es gibt auch keine Sortierung nach
Anruf-Aktualität, sodass „überfällige" Kunden nicht oben stehen.

**Ziel:**
1. Auf jeder Kanban-Karte das **Datum + Uhrzeit des letzten Anrufs** anzeigen.
2. Innerhalb jeder Status-Spalte nach letztem Anruf sortieren: **noch nie
   angerufen ganz oben, danach älteste → neueste** (oben überfällig, unten
   gerade angerufen).

## Scope

- NUR die Kanban-Doska `/clients` (Desktop-Spalten UND Mobile-Tabs — beide laufen
  über den exportierten `Column` → denselben internen `ClientCard`, daher EINE
  Stelle).
- NICHT: Verloren-Doska, Client-Detail, KPI-Tabelle.

## Datenlage (keine Query-/DB-Änderung)

`KanbanClient` (in `clients-kanban-board.tsx`) hat bereits
`lastCall: Date | null` — gemappt in `clients-page-content.tsx` aus
`callLogs[0].calledAt` (die Liste lädt den jüngsten Anruf bereits per
`take: 1, orderBy: { calledAt: "desc" }`). Es ist KEINE Änderung an
`listClients`, am Prisma-Schema oder an der DB nötig.

## Verhalten

### Anzeige
Im internen `ClientCard` eine Zeile mit Phone-Icon:
- mit Anruf: `Letzter Anruf: 16.06.2026 14:30` (absolut, Format
  `dd.MM.yyyy HH:mm` via `date-fns/format`).
- ohne Anruf: `Noch nie angerufen`.

### Sortierung
In der `grouped`-`useMemo` wird jede Status-Spalte sortiert mit:

```
compareByLastCall(a, b):
  beide null         → 0
  a null             → -1   (never-called nach oben)
  b null             → +1
  sonst              → a.lastCall - b.lastCall   (älteste zuerst)
```

Das ersetzt die bisherige Reihenfolge innerhalb der Spalte (rein nach Anruf).
Die Unread-Indikatoren (✉, blauer Rand) bleiben auf den Karten, beeinflussen die
Reihenfolge aber nicht mehr. Da Desktop UND Mobile dasselbe `grouped` über
`Column` rendern, gilt die Sortierung für beide.

## Architektur / Dateien

1. **`src/lib/client-sort.ts`** (neu) — reine, testbare Funktion
   `export function compareByLastCall(a: { lastCall: Date | null }, b: { lastCall: Date | null }): number`.
   (Eigenes Modul, weil der „use client"-Komponentfile nicht in einen
   node/tsx-Test importierbar ist.)

2. **`src/lib/client-sort.test.ts`** (neu) — tsx + `node:assert`-Test.

3. **`src/components/clients/clients-kanban-board.tsx`** (ändern):
   - Import `compareByLastCall` aus `@/lib/client-sort`.
   - Import-Zeile aus `date-fns` um `format` erweitern (aktuell
     `formatDistanceToNowStrict, startOfDay`; `Phone` ist bereits aus
     `lucide-react` importiert).
   - In der `grouped`-`useMemo` nach dem Befüllen jede Spalte
     `.sort(compareByLastCall)`.
   - Im internen `ClientCard` eine Zeile „Letzter Anruf …" / „Noch nie
     angerufen" einfügen (nach der Aktivitäts-Zeile mit den ActivityCounts).

## Out of Scope

- Keine Änderung an `listClients`, Prisma-Schema, DB.
- Keine Sortierung/Anzeige auf Verloren-Doska, Client-Detail, KPI.
- Der relative `updatedAt`-Text auf der Karte bleibt unverändert.

## Tests

`compareByLastCall`:
- never-called (`null`) sortiert VOR einem datierten Eintrag.
- zwei datierte: älterer vor neuerem.
- beide `null` → 0.
- `[neu, null, alt].sort(compareByLastCall)` → `[null, alt, neu]`.
