# Materialkosten + Verloren-Flow

Datum: 2026-06-15
Branch: `redesign-clients`

Zwei kleine Features:

1. **Materialkosten** als neue Standard-Position im Dienstleistungs-Paket des Angebots, sodass die Default-Summe genau 15 000 € beträgt.
2. **Verloren-Flow** früher im Pipeline + freier Grund + separate, versteckte Kanban-Tafel für verlorene Kunden.

---

## Feature 1 — Materialkosten in Dienstleistungen

### Ist-Zustand

`src/lib/offer-services.ts` enthält `SERVICE_PRESETS` mit 12 Positionen. Summe aller `defaultSelected: true` Einträge: **12 797 €**.

Im PDF werden alle Dienstleistungen außer „Förderservice" zu einer einzigen Zeile `Installationspaket (N Leistungen)` zusammengefasst (`src/lib/pdf/offer-renderer.ts:325-331`).

### Änderung

Neue Preset-Zeile in `SERVICE_PRESETS`:

```ts
{
  id: "materialkosten",
  name: "Materialkosten",
  description: "Material für Installation und Montage",
  defaultPrice: 2203,
  defaultQuantity: 1,
  defaultSelected: true,
}
```

Position im Array: nach „Entsorgung Alt-Anlage" (zusammen mit anderen Material-/Demontage-Posten).

### Auswirkung

- Default-Summe Dienstleistungen: **15 000 €** (12 797 + 2 203).
- Im Wizard editierbar wie alle anderen Service-Zeilen.
- Im PDF unsichtbar als eigene Zeile — fließt in „Installationspaket"-Summe.
- Keine Änderung am PDF-Renderer notwendig.

---

## Feature 2 — Verloren-Flow

### 2a. Verloren-Button früher

**Datei:** `src/components/clients/client-detail-workspace.tsx:294-351`

**Bisher:** Buttons Verkauft/Verloren rendern nur wenn
`status ∈ {ANGEBOT_VERSENDET, IM_KONTAKT}` **und** mindestens ein Angebot mit `status = SENT`.

**Neu:**
- **Verloren-Button:** rendert wenn `status ∈ {ANGERUFEN, ANGEBOT_VERSENDET, IM_KONTAKT}`. Keine Angebot-Bedingung mehr.
- **Verkauft-Button:** unverändert.

### 2b. Grund-Dialog

Neue Komponente `src/components/clients/verloren-reason-dialog.tsx`:

- Öffnet sich beim Klick auf Verloren (ersetzt das bisherige `window.confirm`).
- Inhalt:
  - Titel: `Kunde als verloren markieren?`
  - Beschreibung: `Erinnerungen werden gestoppt. Diese Aktion kann nur durch manuelle Statusänderung rückgängig gemacht werden.`
  - Textarea: Label `Grund (optional)`, Placeholder `z.B. Preis zu hoch, Konkurrent gewählt …`, leer erlaubt.
  - Buttons: `Abbrechen` / `Als verloren markieren` (destructive variant).
- Submit → ruft `markClientNichtVerkauft(clientId, verlustgrund || null)`.

### 2c. Schema-Änderung

```prisma
model Client {
  // bestehende Felder …
  verlustgrund String?
}
```

Migration: `prisma migrate dev --name add_client_verlustgrund`.

### 2d. Server-Action

`src/lib/actions/clients.ts` — `markClientNichtVerkauft`:

```ts
markClientNichtVerkauft(clientId: string, verlustgrund: string | null)
```

Logik:
1. `prisma.client.update` — setzt `status = NICHT_VERKAUFT` und `verlustgrund`.
2. Falls offene Angebote/Reminder existieren → `cancelClientOfferReminders(clientId)` (bestehende Logik).
3. `auditLog` mit `details: { verlustgrund }`.

### 2e. Versteckte Tafel `/clients/verloren`

**Route:** `src/app/(dashboard)/clients/verloren/page.tsx`.

**Layout:**
- Header: Titel `Verlorene Kunden` + Back-Link `← Zurück zu Kunden`.
- Sub-Header: Zähler `N verloren · X mit Grund · Y ohne Grund`.
- Suche per Name / Kundennummer / Stadt.

**Kanban — 2 Spalten:**

| Spalte | Inhalt |
|---|---|
| **Mit Grund** | `verlustgrund IS NOT NULL` — Karte zeigt Grund kursiv unter Name |
| **Ohne Grund** | `verlustgrund IS NULL` |

Sortierung in Spalten: `updatedAt DESC`. Kein Drag-and-Drop (kein sinnvoller Übergang). Klick auf Karte → `/clients/[id]`.

**Komponenten:**
- `src/components/clients/verloren-kanban-board.tsx` — die zwei-Spalten-Tafel.
- Karten-Komponente wiederverwenden aus bestehender Kanban-Logik (`clients-kanban-board.tsx`) — wenn die Karte dort lokal definiert ist, extrahieren als `client-kanban-card.tsx` und beide importieren.

### 2f. Einstieg in die versteckte Tafel

**Desktop** (`clients-kanban-board.tsx:184-205`):
- Die schmale eingeklappte `Verloren`-Spalte bleibt sichtbar mit Zähler.
- Klick darauf → `router.push('/clients/verloren')` (anstelle des bisherigen Inline-Expand).
- Inline-Expand-Verhalten wird entfernt.

**Mobile** (`MobileStatusTabs`):
- Der `Verloren`-Tab navigiert auch zu `/clients/verloren`.

### 2g. Neue Action

`src/lib/actions/clients.ts`:

```ts
getVerloreneClients(searchQuery?: string): Promise<{
  mitGrund: ClientWithRelations[];
  ohneGrund: ClientWithRelations[];
}>
```

Filter: `status = NICHT_VERKAUFT`. Bei `searchQuery` zusätzlich filtern (name/customerNumber/city, case-insensitive).

---

## Nicht im Scope

- Änderungen am Verkauft-Button.
- Änderungen am PDF-Renderer.
- Drag-and-Drop auf der Verlorene-Tafel.
- Statistiken / Gruppierung nach Gründen (kann später kommen, wenn Gründe sich häufen).
- Standardisierte Liste vordefinierter Gründe (User hat freien Text gewählt).

## Migrations-Reihenfolge

1. Prisma migration `add_client_verlustgrund`.
2. Code-Änderungen.
3. Smoke-Test: Existierende verlorene Kunden landen automatisch in „Ohne Grund" (NULL).
