# Förderfähige Kosten automatisch nach Wohneinheiten

**Datum:** 2026-06-16
**Status:** Genehmigt (Design)
**Branch:** redesign-clients

## Problem / Ziel

Im Angebots-Wizard (Schritt „Förderung", `KfwCalculator`) ist das Feld
**„Förderfähige Kosten (€)"** ein manuelles Eingabefeld mit Default 30.000 €.
Es liest die im Anfrage-Schritt erfasste **Anzahl Wohneinheiten**
(`inquiry.wohneinheiten`) NICHT.

Nach den BEG-/KfW-458-Regeln steigt die förderfähige Höchstgrenze mit der Zahl
der Wohneinheiten. Bei 2 Wohneinheiten sind es 45.000 € statt 30.000 €. Aktuell
muss der Nutzer das von Hand anpassen — und vergisst es leicht.

**Ziel:** Das Feld soll sich beim Ändern der Anzahl Wohneinheiten automatisch auf
die korrekte Höchstgrenze setzen, dabei aber editierbar bleiben (manuelle
Korrektur möglich).

## Recherche-Grundlage (BEG / KfW 458, Stand 2024+)

Förderfähige Höchstkosten nach Anzahl Wohneinheiten (WE):

| Wohneinheit            | Höchstkosten pro WE |
|------------------------|---------------------|
| 1. WE                  | 30.000 €            |
| 2.–6. WE (je)          | 15.000 €            |
| ab 7. WE (je)          | 8.000 €             |

Beispiele kumuliert: 1 → 30.000, 2 → 45.000, 3 → 60.000, 6 → 105.000,
7 → 113.000 €.

Förderquote: max. **70 %** (Grundförderung 30 % + Klimageschwindigkeitsbonus
20 % + Einkommensbonus 30 % + Effizienzbonus 5 %, gedeckelt bei 70 %). Die
„55 %" aus der Nutzerbeschreibung sind der aktuelle Default OHNE Einkommensbonus
(30 + 20 + 5). **Die Prozent-Logik ist bereits korrekt und wird NICHT geändert.**

Quellen:
- KfW Merkblatt 458: https://www.kfw.de/PDF/Download-Center/Förderprogramme-(Inlandsförderung)/PDF-Dokumente/6000005131_M_458.pdf
- https://www.baufi24.de/foerderung/kfw-458-heizungsfoerderung/
- https://www.energie-experten.org/news/beg-foerderung-heizung-sanierung-ab-2024-bis-zu-90000-eur-foerderfaehige-kosten-moeglich

## Verhalten

- Beim Ändern von **Anzahl Wohneinheiten** wird „Förderfähige Kosten" automatisch
  auf die berechnete Höchstgrenze gesetzt.
- Das Feld bleibt **editierbar** — eine manuelle Eingabe bleibt erhalten, bis sich
  die Anzahl Wohneinheiten erneut ändert (dann wird neu berechnet).
- Leere/ungültige Wohneinheiten-Angabe → wie 1 WE (30.000 €).

Formel:

```
maxFoerderfaehigeKosten(WE) = 30000
                            + min(WE - 1, 5) * 15000   // WE 2..6
                            + max(WE - 6, 0) * 8000     // WE 7+
```

Mit `WE = max(1, floor(wohneinheiten || 1))`.

## Änderungen je Datei

1. **`src/lib/kfw-foerderung.ts`**
   - Neue reine Funktion
     `export function maxFoerderfaehigeKosten(wohneinheiten: number): number`
     gemäß obiger Formel.
   - Keine Änderung an `calcKfw`, `KFW_MAX_PERCENT`, `KFW_BONI`,
     `DEFAULT_KFW_FOERDERUNG` oder `parseKfwFoerderung`.

2. **`src/lib/kfw-foerderung.test.ts`** (neu) — tsx + `node:assert`-Test für
   `maxFoerderfaehigeKosten` (Muster wie `src/lib/heizlast.test.ts`).

3. **`src/components/offers/offer-wizard-dialog.tsx`**
   - `DiscountsStepProps`: Feld `control` ergänzen.
   - Render-Stelle von `<DiscountsStep .../>` (Schritt 2): `control={control}`
     durchreichen.
   - `DiscountsStep`: `control` annehmen und an
     `<KfwCalculator control={control} setValue={setValue} />` weitergeben.
   - `KfwCalculator`:
     - Prop `control` ergänzen.
     - `inquiry.wohneinheiten` via `useWatch` lesen, `WE` parsen,
       `cap = maxFoerderfaehigeKosten(WE)` berechnen.
     - `useEffect` mit Dependency `[cap]`: setzt `foerderfaehigeKosten` auf `cap`
       (feuert nur, wenn sich `cap` durch geänderte WE ändert — manuelle Edits am
       Feld ändern `cap` nicht und bleiben daher erhalten).
     - Hilfetext unter dem Feld anpassen: erklärt die gestaffelte Höchstgrenze und
       dass sie aus der Anzahl Wohneinheiten vorbefüllt wird.
   - Import `maxFoerderfaehigeKosten` aus `@/lib/kfw-foerderung`; `useEffect`
     ergänzen, falls noch nicht importiert.

## Out of Scope

- Keine Änderung der Förderquoten-Logik (Boni, 70 %-Deckel).
- Kein Clamping von `foerderfaehigeKosten` auf die tatsächlichen Projektkosten.
- Keine Schema-/Persistenz-Änderung (`foerderfaehigeKosten` liegt bereits im
  JSON `kfwFoerderung`).
- Keine Änderung am PDF-Renderer (nutzt den gespeicherten Wert).
- Keine Behandlung der WE-spezifischen Boni-Aufteilung (Selbstnutzer vs.
  vermietete Einheiten) — Prozentsatz bleibt wie bisher pauschal.

## Tests

- `maxFoerderfaehigeKosten`: WE 1 → 30000, 2 → 45000, 3 → 60000, 6 → 105000,
  7 → 113000; WE 0/NaN/negativ → 30000.
