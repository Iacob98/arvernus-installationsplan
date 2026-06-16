# Saniert-Frage im Heizlast-Kalkulator

**Datum:** 2026-06-16
**Status:** Genehmigt (Design)
**Branch:** redesign-clients

## Problem / Ziel

Bei der Angebots-Informationssammlung gibt es das Feld **Baujahr** (Baualtersklasse).
Der Heizlast-Kalkulator (`HeizlastWidget` im Angebots-Wizard) leitet daraus die
spezifische Heizlast (W/m²) und die empfohlene Wärmepumpen-Größe in kW ab.

Aktuell wird der **Sanierungszustand** des Gebäudes ignoriert — obwohl er die
Heizlast stark beeinflusst. Ein saniertes Haus hat bei gleichem Baujahr eine
deutlich geringere Heizlast als ein unsaniertes.

**Ziel:** Direkt nach dem Baujahr eine Frage **„Saniert?"** mit drei Optionen
ergänzen, die die kW-Berechnung beeinflusst.

## Recherche-Grundlage

Spezifische Heizlast nach Sanierungsstand (deutsche Richtwerte):

| Sanierungsstand     | W/m²        | Verhältnis zu „unsaniert" |
|---------------------|-------------|---------------------------|
| Unsanierter Altbau  | 120–180 (≈150) | ×1,00                  |
| Teilsaniert         | ≈100        | ×0,67 (≈ −30 %)           |
| Saniert             | 60–80 (≈70) | ×0,47 (≈ −50 %)           |
| Neubau (GEG)        | 40–50       | —                         |

Quellen:
- https://www.deutschland-rechner.de/heizlast-rechner
- https://priwatt.de/blog/heizlastberechnung/
- https://www.waermepumpe.de/presse/news/details/neues-baualtersklassenverfahren-im-heizlastrechner/

Die in `src/lib/heizlast.ts` hinterlegten Werte (`bis 1977`=150, `1978–1994`=100,
`1995–2001`=70, `2002–2008`=55, `ab 2009`=35) entsprechen faktisch der
**unsanierten Baseline** je Baualtersklasse. Der Sanierungsstand wird daher als
sauberer Multiplikator darauf abgebildet.

## Verhalten

Neues Chip-Feld **„Saniert?"** direkt nach **Baujahr** in der Sektion „Gebäude"
des Angebots-Wizards. Drei Optionen:

- **Nein** (unsaniert)
- **Ja, 50%** (teilsaniert)
- **Ja** (vollsaniert)

Der gewählte Wert multipliziert die spezifische Heizlast (W/m²) in der
**Flächen-Methode**:

| Antwort           | Multiplikator | Beispiel: 150 m², `1978–1994` (100 W/m² → 15,0 kW) |
|-------------------|---------------|----------------------------------------------------|
| Nein / leer       | ×1,00         | 15,0 kW                                            |
| Ja, 50%           | ×0,70         | 10,5 kW                                            |
| Ja                | ×0,50         | 7,5 kW                                             |

## Wichtiges Berechnungsdetail

Der Multiplikator wirkt **ausschließlich auf `heizlastByArea`** (Flächen-Methode).

`heizlastByConsumption` (Jahresverbrauch / VBH) bleibt unverändert — der reale
Verbrauch spiegelt den tatsächlichen Dämmstand bereits wider. Das passt zur
bestehenden Logik, bei der der Verbrauchswert Vorrang hat, wenn beide Methoden
vorliegen. Der Saniert-Faktor wirkt sich also primär aus, wenn nur die
Flächen-Methode Daten hat.

## Default / Abwärtskompatibilität

- `saniert` nicht gewählt → Multiplikator ×1,0 (Verhalten wie bisher, keine
  Reduktion — konservativ, eher größere WP).
- Bestehende Angebote/Clients ohne `saniert` brechen nicht.

## Änderungen je Datei

1. **`prisma/schema.prisma`** — Feld `saniert String?` im Model `Client`;
   neue Migration.
2. **`src/lib/heizlast.ts`**
   - `SANIERT_CHIPS = ["Nein", "Ja, 50%", "Ja"] as const` exportieren.
   - `SaniertChip` Typ.
   - `SANIERT_FACTOR: Record<SaniertChip, number> = { "Nein": 1.0, "Ja, 50%": 0.70, "Ja": 0.50 }`.
   - `HeizlastInput.saniert?: SaniertChip | null`.
   - `heizlastByArea` mit dem Faktor multiplizieren (Faktor 1,0 bei null/unbekannt).
3. **`src/lib/validations/offer.ts`** — `saniert: z.string().nullable().optional()`
   in `offerInquirySchema`.
4. **`src/lib/validations/client.ts`** — `saniert: z.string().nullable().optional()`
   in der Client-Inquiry-Schema.
5. **`src/components/offers/offer-wizard-dialog.tsx`**
   - Neues Feld in `INQUIRY_FIELDS` (Sektion „Gebäude", direkt nach
     `constructionYear`): `key: "saniert"`, `label: "Saniert?"`,
     `chips: [...SANIERT_CHIPS]`.
   - `HeizlastWidget` liest `inquiry.saniert` und reicht es an `calcHeizlast`
     weiter (Validierung gegen `SANIERT_CHIPS`, sonst null).
6. **`src/components/clients/inquiry-editor.tsx`** — Feld „Saniert?" spiegeln
   (gleiche Client-Spalte, für Datenkonsistenz). Kein Kalkulator dort.

## Chip-Labels (genehmigt)

`Ja` / `Nein` / `Ja, 50%` — Speicherung als wörtlicher String, exaktes Matching
gegen `SANIERT_CHIPS` in `calcHeizlast`.

## Out of Scope

- Keine Änderung an den Baualtersklassen-Chips (`BAUJAHR_CHIPS` bleiben).
- Keine Änderung an `heizlastByConsumption`, Puffer-/WW-Speicher-Formeln,
  WP-Standardgrößen.
- Keine Migration bestehender Datensätze (Default greift).

## Tests

- `calcHeizlast`: Flächen-Methode × jeder Saniert-Faktor (Nein/Ja50/Ja/null)
  ergibt erwartete kW.
- `calcHeizlast`: Verbrauchs-Methode bleibt von `saniert` unbeeinflusst.
- `calcHeizlast`: unbekannter/leerer `saniert`-Wert → Faktor 1,0.
