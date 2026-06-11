export const MONTHS_DE = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

// Typische monatliche Heizlastverteilung in % (Summe = 100)
export const DEFAULT_MONTHLY_DISTRIBUTION = [
  16, 14, 11, 7, 4, 1, 0.5, 0.5, 3, 8, 14, 21,
];

export type HeatBalance = {
  enabled: boolean;
  annualConsumptionKwh: number; // Verbrauch des Altgeräts
  scop: number;
  gasPricePerKwh: number;
  oilPricePerLiter: number;
  electricityPricePerKwh: number;
  pvSharePercent: number;
  bufferSharePercent: number;
  fuel: "GAS" | "OEL" | "STROM";
  monthlyDistribution: number[];
};

export const DEFAULT_HEAT_BALANCE: HeatBalance = {
  enabled: true,
  annualConsumptionKwh: 25000,
  scop: 3.8,
  gasPricePerKwh: 0.2,
  oilPricePerLiter: 1.2,
  electricityPricePerKwh: 0.3,
  pvSharePercent: 0,
  bufferSharePercent: 0,
  fuel: "GAS",
  monthlyDistribution: DEFAULT_MONTHLY_DISTRIBUTION,
};

export function parseHeatBalance(value: unknown): HeatBalance | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<HeatBalance>;
  if (typeof v.enabled !== "boolean") return null;
  return {
    enabled: v.enabled,
    annualConsumptionKwh: Number(v.annualConsumptionKwh) || 0,
    scop: Number(v.scop) || DEFAULT_HEAT_BALANCE.scop,
    gasPricePerKwh: Number(v.gasPricePerKwh) || DEFAULT_HEAT_BALANCE.gasPricePerKwh,
    oilPricePerLiter:
      Number(v.oilPricePerLiter) || DEFAULT_HEAT_BALANCE.oilPricePerLiter,
    electricityPricePerKwh:
      Number(v.electricityPricePerKwh) ||
      DEFAULT_HEAT_BALANCE.electricityPricePerKwh,
    pvSharePercent: Number(v.pvSharePercent) || 0,
    bufferSharePercent: Number(v.bufferSharePercent) || 0,
    fuel: (v.fuel as HeatBalance["fuel"]) ?? "GAS",
    monthlyDistribution:
      Array.isArray(v.monthlyDistribution) && v.monthlyDistribution.length === 12
        ? v.monthlyDistribution.map((n) => Number(n) || 0)
        : DEFAULT_MONTHLY_DISTRIBUTION,
  };
}

export type HeatBalanceResult = {
  costBefore: number;
  costAfter: number;
  kwhBefore: number;
  kwhAfter: number;
  wpAnnualKwh: number;
  monthly: {
    month: string;
    fromGrid: number;
    fromPv: number;
    fromBuffer: number;
    total: number;
  }[];
  maxMonthlyKwh: number;
};

export function calcHeatBalance(b: HeatBalance): HeatBalanceResult {
  const kwhBefore = b.annualConsumptionKwh;
  const wpAnnualKwh = b.scop > 0 ? kwhBefore / b.scop : kwhBefore;
  const kwhAfter = wpAnnualKwh;

  const fuelPricePerKwh =
    b.fuel === "OEL"
      ? // 1 Liter Öl ≈ 10 kWh — пересчёт цены за литр в цену за kWh
        b.oilPricePerLiter / 10
      : b.fuel === "STROM"
        ? b.electricityPricePerKwh
        : b.gasPricePerKwh;
  const costBefore = kwhBefore * fuelPricePerKwh;
  const costAfter = wpAnnualKwh * b.electricityPricePerKwh;

  const pvFrac = clamp01(b.pvSharePercent / 100);
  const bufFrac = clamp01(b.bufferSharePercent / 100);
  const gridFrac = Math.max(0, 1 - pvFrac - bufFrac);

  const distSum = b.monthlyDistribution.reduce((s, n) => s + n, 0) || 100;

  const monthly = MONTHS_DE.map((month, i) => {
    const share = b.monthlyDistribution[i] / distSum;
    const total = wpAnnualKwh * share;
    return {
      month,
      fromGrid: total * gridFrac,
      fromPv: total * pvFrac,
      fromBuffer: total * bufFrac,
      total,
    };
  });

  const maxMonthlyKwh = monthly.reduce((m, x) => Math.max(m, x.total), 0);

  return {
    costBefore,
    costAfter,
    kwhBefore,
    kwhAfter,
    wpAnnualKwh,
    monthly,
    maxMonthlyKwh,
  };
}

function clamp01(n: number): number {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

export function extractKwhFromText(text: string | null | undefined): number {
  if (!text) return 0;
  const cleaned = text.replace(/\./g, "").replace(/,/g, ".");
  const m = cleaned.match(/[\d.]+/);
  if (!m) return 0;
  return Math.round(Number(m[0]));
}
