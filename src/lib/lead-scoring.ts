/**
 * Lead scoring для клиентов теплового насоса.
 * Считается на лету по данным Client (никакой записи в БД).
 *
 * Tiers: hot (>= 70), warm (>= 40), cold (< 40).
 */

export type LeadScoreInput = {
  ownership?: string | null;
  constructionYear?: string | null;
  buildingType?: string | null;
  heatingAge?: string | null;
  annualKwhGas?: string | null;
  annualLitersOil?: string | null;
  wohnflaecheM2?: string | null;
  incomeRange?: string | null;
};

export type LeadScoreReason = { weight: number; text: string };

export type LeadScoreResult = {
  score: number;
  tier: "hot" | "warm" | "cold";
  reasons: LeadScoreReason[];
};

const HOT_THRESHOLD = 70;
const WARM_THRESHOLD = 40;

const OLD_BAUJAHR_CHIPS = ["bis 1977", "1978–1994", "1995–2001"];

function isEigentuemer(value?: string | null): boolean {
  if (!value) return false;
  const v = value.toLowerCase();
  return v.includes("eigent") || v.includes("besitzer") || v.includes("owner");
}

function isOldBuilding(value?: string | null): boolean {
  if (!value) return false;
  if (OLD_BAUJAHR_CHIPS.includes(value)) return true;
  const yearMatch = value.match(/\b(1[89]\d{2}|20[01]\d)\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1], 10);
    return year <= 2009;
  }
  return false;
}

function isOldHeating(value?: string | null): boolean {
  if (!value) return false;
  if (/(> ?20|über ?20|defekt|kaputt|20[ -]?30|> ?30)/i.test(value)) return true;
  const m = value.match(/(\d+)\s*Jahre/i);
  if (m) return parseInt(m[1], 10) >= 20;
  return false;
}

function isEinfamilienhaus(value?: string | null): boolean {
  if (!value) return false;
  return /(einfamilien|zweifamilien|reihen|efh|zfh|doppelhaus)/i.test(value);
}

function parseNumber(value?: string | null): number {
  if (!value) return 0;
  const cleaned = value.replace(/\./g, "").replace(/,/g, ".");
  const m = cleaned.match(/[\d.]+/);
  return m ? Number(m[0]) || 0 : 0;
}

function isLowIncome(value?: string | null): boolean {
  if (!value) return false;
  return /(unter|<).*40[\.,]?000|40\.?000.*(unter|<)/i.test(value);
}

export function calcLeadScore(c: LeadScoreInput): LeadScoreResult {
  let score = 0;
  const reasons: LeadScoreReason[] = [];

  const eigent = isEigentuemer(c.ownership);
  const oldBuilding = isOldBuilding(c.constructionYear);

  if (eigent && oldBuilding) {
    score += 30;
    reasons.push({ weight: 30, text: "Eigentümer + Baujahr ≤ 2009 (KfW-fähig)" });
  } else if (eigent) {
    score += 15;
    reasons.push({ weight: 15, text: "Eigentümer" });
  }

  if (isOldHeating(c.heatingAge)) {
    score += 25;
    reasons.push({ weight: 25, text: "Heizung > 20 Jahre" });
  }

  const kwh = parseNumber(c.annualKwhGas);
  const liter = parseNumber(c.annualLitersOil);
  const hasHighConsumption = kwh > 18000 || liter > 2000;
  if (hasHighConsumption) {
    score += 20;
    reasons.push({
      weight: 20,
      text: kwh > 18000 ? `> 18.000 kWh/a Gas` : `> 2.000 L/a Heizöl`,
    });
  }

  if (isEinfamilienhaus(c.buildingType)) {
    score += 15;
    reasons.push({ weight: 15, text: "Ein-/Zweifamilienhaus" });
  }

  const fl = parseNumber(c.wohnflaecheM2);
  if (fl >= 120 && fl <= 220) {
    score += 10;
    reasons.push({ weight: 10, text: "Wohnfläche im sweet spot (120–220 m²)" });
  }

  if (isLowIncome(c.incomeRange)) {
    score += 10;
    reasons.push({ weight: 10, text: "Einkommen < 40.000 € (KfW-Bonus)" });
  }

  const capped = Math.min(score, 100);
  const tier: LeadScoreResult["tier"] =
    capped >= HOT_THRESHOLD ? "hot" : capped >= WARM_THRESHOLD ? "warm" : "cold";

  return { score: capped, tier, reasons };
}

export const LEAD_TIER_LABEL: Record<LeadScoreResult["tier"], string> = {
  hot: "Hot",
  warm: "Warm",
  cold: "Cold",
};
