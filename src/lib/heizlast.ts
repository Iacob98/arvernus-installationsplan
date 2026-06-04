/**
 * Vereinfachte Heizlastberechnung in Anlehnung an die Methode des
 * BWP Heizlastrechners (https://www.waermepumpe.de/werkzeuge/heizlastrechner/).
 *
 * Wir nutzen die spezifische Heizlast in W/m² nach Baujahr / Dämmstandard
 * und optional die Querschätzung über den Jahresverbrauch (Vollbenutzungsstunden).
 *
 * Hinweis: Dies ersetzt keine detaillierte DIN-EN-12831-1-Berechnung,
 * dient aber als schnelle Empfehlung für die Wärmepumpen-Auswahl im Verkauf.
 */

export const BAUJAHR_CHIPS = [
  "bis 1977",
  "1978–1994",
  "1995–2001",
  "2002–2008",
  "ab 2009",
] as const;

export type BaujahrChip = (typeof BAUJAHR_CHIPS)[number];

/** spezifische Heizlast in W/m² */
const SPEZ_HEIZLAST: Record<BaujahrChip, number> = {
  "bis 1977": 180,
  "1978–1994": 100,
  "1995–2001": 80,
  "2002–2008": 60,
  "ab 2009": 40,
};

/** Vollbenutzungsstunden in Deutschland (Heizperiode) */
const VBH = 2100;

/** Trinkwarmwasser: ca. 0,2 kW pro Person */
const TWW_PRO_PERSON_KW = 0.2;

export type HeizlastInput = {
  wohnflaecheM2?: number;
  baujahr?: BaujahrChip | null;
  jahresverbrauchKwh?: number;
  personen?: number;
};

export type HeizlastEstimate = {
  /** Heizlast Gebäude in kW (Mittelwert beider Methoden, falls verfügbar) */
  heizlastKw: number;
  /** Heizlast nur über Fläche × spez. Wert */
  heizlastByArea: number | null;
  /** Heizlast nur über Jahresverbrauch / VBH */
  heizlastByConsumption: number | null;
  /** Trinkwarmwasser zusätzlich */
  tww: number;
  /** Empfohlene WP-Größe in kW (etwas Reserve) */
  empfohleneWpKw: number;
  /** Empfohlener Pufferspeicher in Litern */
  pufferLiter: number;
  /** Empfohlener Warmwasserspeicher in Litern */
  wwLiter: number;
};

export function calcHeizlast(input: HeizlastInput): HeizlastEstimate {
  const wohn = Math.max(0, input.wohnflaecheM2 ?? 0);
  const verbrauch = Math.max(0, input.jahresverbrauchKwh ?? 0);
  const personen = Math.max(0, input.personen ?? 0);

  const spez = input.baujahr ? SPEZ_HEIZLAST[input.baujahr] : null;

  const heizlastByArea = wohn > 0 && spez ? (wohn * spez) / 1000 : null;
  const heizlastByConsumption = verbrauch > 0 ? (verbrauch / VBH) * 0.9 : null;

  const candidates = [heizlastByArea, heizlastByConsumption].filter(
    (v): v is number => v !== null && v > 0,
  );
  const heizlast =
    candidates.length === 0
      ? 0
      : candidates.reduce((s, v) => s + v, 0) / candidates.length;

  const tww = personen * TWW_PRO_PERSON_KW;

  const total = heizlast + tww;
  // Empfohlene WP-Größe ≈ Heizlast aufgerundet auf nächste Standardgröße (8/12/16/20)
  const standardGroessen = [4, 6, 8, 10, 12, 14, 16, 18, 20, 25];
  const empfohlen =
    standardGroessen.find((g) => g >= total) ??
    standardGroessen[standardGroessen.length - 1];

  // Faustformeln Speicher
  const puffer = roundTo50(empfohlen * 40); // ~ 40 L/kW
  const ww = personen <= 2 ? 200 : personen <= 4 ? 300 : 400;

  return {
    heizlastKw: round1(heizlast),
    heizlastByArea: heizlastByArea !== null ? round1(heizlastByArea) : null,
    heizlastByConsumption:
      heizlastByConsumption !== null ? round1(heizlastByConsumption) : null,
    tww: round1(tww),
    empfohleneWpKw: empfohlen,
    pufferLiter: puffer,
    wwLiter: ww,
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function roundTo50(n: number): number {
  return Math.round(n / 50) * 50;
}
