export type TotalsInput = {
  positions: { unitPrice: number; quantity: number }[];
  discounts: { kind: "PERCENT" | "AMOUNT" | "FOERDERUNG"; value: number; label: string }[];
};

export type Totals = {
  subtotal: number;
  appliedDiscounts: { label: string; amount: number }[];
  netto: number;
  vat: number;
  brutto: number;
  foerderungen: { label: string; amount: number }[];
  foerderungTotal: number;
};

export const VAT_RATE = 0.19;

export function calcTotals({ positions, discounts }: TotalsInput): Totals {
  const subtotal = positions.reduce(
    (sum, p) => sum + (Number(p.unitPrice) || 0) * (p.quantity || 0),
    0,
  );

  let runningNetto = subtotal;
  const appliedDiscounts: Totals["appliedDiscounts"] = [];
  for (const d of discounts) {
    if (d.kind === "FOERDERUNG") continue;
    const val = Number(d.value) || 0;
    const amount = d.kind === "PERCENT" ? (runningNetto * val) / 100 : val;
    appliedDiscounts.push({ label: d.label, amount });
    runningNetto -= amount;
  }

  const netto = Math.max(0, runningNetto);
  const vat = netto * VAT_RATE;
  const brutto = netto + vat;

  const foerderungen = discounts
    .filter((d) => d.kind === "FOERDERUNG")
    .map((d) => ({ label: d.label, amount: Number(d.value) || 0 }));
  const foerderungTotal = foerderungen.reduce((s, f) => s + f.amount, 0);

  return { subtotal, appliedDiscounts, netto, vat, brutto, foerderungen, foerderungTotal };
}

export function fmtEUR(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value);
}
