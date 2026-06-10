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

/**
 * spezifische Heizlast in W/m² — Mittelwerte aus den BWP-Empfehlungen
 * (Verbraucherzentrale / EPISCOPE) für unsanierte bzw. teilsanierte
 * Gebäude des jeweiligen Baujahres. Frühere Werte (180/100/80/60/40) lagen
 * an der oberen Grenze und überschätzten die Heizlast bei realistisch
 * gedämmten Häusern um ca. 15–25 %.
 */
const SPEZ_HEIZLAST: Record<BaujahrChip, number> = {
  "bis 1977": 150,
  "1978–1994": 100,
  "1995–2001": 70,
  "2002–2008": 55,
  "ab 2009": 35,
};

/** Vollbenutzungsstunden in Deutschland (Heizperiode) */
const VBH = 2100;

/**
 * Trinkwarmwasser: ca. 0,2 kW pro Person — nur als Hinweis ausgewiesen.
 * In die WP-Größen­empfehlung geht TWW NICHT mit ein, weil es üblicherweise
 * über Pufferspeicher und WW-Speicher abgedeckt wird, nicht über die
 * Auslegungs-Heizlast der Wärmepumpe.
 */
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

  // Wenn beide Methoden vorliegen, hat der Verbrauchswert Vorrang — er
  // spiegelt die tatsächliche Wärmeabnahme wider, während die m²-Methode
  // eine theoretische Obergrenze nach Baualtersklasse ist.
  let heizlast: number;
  if (heizlastByConsumption !== null && heizlastByConsumption > 0) {
    heizlast = heizlastByConsumption;
  } else if (heizlastByArea !== null && heizlastByArea > 0) {
    heizlast = heizlastByArea;
  } else {
    heizlast = 0;
  }

  const tww = personen * TWW_PRO_PERSON_KW;

  // WP-Größe wird ausschließlich nach der Gebäude-Heizlast dimensioniert.
  // TWW wird über Puffer/WW-Speicher abgefangen und fließt nicht in die
  // Auslegung der WP-Leistung ein.
  const standardGroessen = [4, 6, 8, 10, 12, 14, 16, 18, 20, 25];
  const empfohlen = nearestStandard(heizlast, standardGroessen);

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

/**
 * Rundet auf die nächstgelegene Standardgröße. Bei Gleichstand wird zur
 * kleineren Größe abgerundet (Überdimensionierung vermeiden).
 */
function nearestStandard(target: number, sizes: readonly number[]): number {
  if (target <= 0) return sizes[0];
  let best = sizes[0];
  let bestDiff = Math.abs(sizes[0] - target);
  for (const s of sizes) {
    const d = Math.abs(s - target);
    if (d < bestDiff || (d === bestDiff && s < best)) {
      best = s;
      bestDiff = d;
    }
  }
  return best;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function roundTo50(n: number): number {
  return Math.round(n / 50) * 50;
}
