import { fmtEUR } from "@/lib/offer-totals";

export type OfferEmailContext = {
  firstName: string | null;
  bruttoTotal: number;
  foerderungAmount: number;
  rabattPercent: number;
  rabattFristTage: number;
  finanzierungMonate: number;
  managerName: string;
};

/**
 * Schätzung der monatlichen Finanzierungsrate (linear, ohne Zinsen).
 * Auf 10 € abgerundet.
 */
export function estimatedMonthlyRate(
  bruttoTotal: number,
  foerderung: number,
  monate: number,
): number {
  const finanziert = Math.max(0, bruttoTotal - foerderung);
  if (monate <= 0) return 0;
  const raw = finanziert / monate;
  return Math.round(raw / 10) * 10;
}

export function defaultOfferEmailBody(ctx: OfferEmailContext): string {
  const greeting = ctx.firstName ? `Hallo ${ctx.firstName},` : "Hallo,";
  const rate = estimatedMonthlyRate(
    ctx.bruttoTotal,
    ctx.foerderungAmount,
    ctx.finanzierungMonate,
  );
  const foerderungLine =
    ctx.foerderungAmount > 0
      ? `Möchtest du deine neue Wärmepumpe bequem für ca. ${rate} € im Monat finanzieren und die volle Fördersumme behalten? Sichere dir damit zusätzliche Liquidität von bis zu ${fmtEUR(ctx.foerderungAmount)}.`
      : `Möchtest du deine neue Wärmepumpe bequem für ca. ${rate} € im Monat finanzieren?`;

  return [
    greeting,
    "",
    "im Anhang findest du dein individuelles Angebot.",
    "",
    `Dein Vorteil: Bei einer Zusage innerhalb von ${ctx.rabattFristTage} Tagen erhältst du einen Gesamtrabatt von ${ctx.rabattPercent} %.`,
    "",
    foerderungLine,
    "",
    "Nach Erhalt des unterschriebenen Angebots unterstützen wir dich gemeinsam mit unserem Finanzierungspartner bei der gesamten Abwicklung.",
    "",
    "Bei Fragen melde dich gerne.",
    "",
    "Viele Grüße",
    ctx.managerName,
  ].join("\n");
}

export const DEFAULT_RABATT_PERCENT = 5;
export const DEFAULT_RABATT_FRIST_TAGE = 7;
export const DEFAULT_FINANZIERUNG_MONATE = 60;
