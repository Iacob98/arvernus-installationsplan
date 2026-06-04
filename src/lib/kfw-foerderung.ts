export type KfwFoerderung = {
  enabled: boolean;
  grundfoerderung: boolean;
  einkommensbonus: boolean;
  geschwindigkeitsbonus: boolean;
  innovationsbonus: boolean;
  foerderfaehigeKosten: number;
};

export const DEFAULT_KFW_FOERDERUNG: KfwFoerderung = {
  enabled: true,
  grundfoerderung: true,
  einkommensbonus: false,
  geschwindigkeitsbonus: true,
  innovationsbonus: true,
  foerderfaehigeKosten: 30000,
};

export const KFW_MAX_PERCENT = 70;

export const KFW_BONI = [
  {
    key: "grundfoerderung" as const,
    label: "Grundförderung",
    percent: 30,
    description:
      "Diese Basisförderung wird beim Kauf und Einbau einer Wärmepumpe gewährt, wenn diese als Ersatz für das alte Heizungssystem verwendet wird. Sie gilt unabhängig vom Einkommen!",
    locked: true,
  },
  {
    key: "einkommensbonus" as const,
    label: "Einkommensbonus",
    percent: 30,
    description:
      "Dieser Bonus richtet sich speziell an selbst nutzende Eigentümer, deren Haushaltseinkommen unter 40.000 € liegt. Mit diesem Zuschuss sollen Haushalte mit niedrigerem Einkommen zusätzlich entlastet werden.",
  },
  {
    key: "geschwindigkeitsbonus" as const,
    label: "Geschwindigkeitsbonus",
    percent: 20,
    description:
      "Dieser Bonus wird gewährt, wenn sich Eigentümer dazu entscheiden, bis zum 31.12.2028 auf eine regenerative Heiztechnologie (wie die Wärmepumpe) umzurüsten.",
  },
  {
    key: "innovationsbonus" as const,
    label: "Innovationsbonus",
    percent: 5,
    description:
      "Diese Zusatzförderung belohnt den Einsatz besonders umweltfreundlicher Wärmepumpen. Sie gilt für Systeme, die natürliche Kältemittel verwenden, sowie für Erd- und Grundwasserwärmepumpen.",
  },
];

export type KfwResult = {
  percent: number;
  amount: number;
  selected: { label: string; percent: number; description: string }[];
};

export function calcKfw(k: KfwFoerderung): KfwResult {
  let percent = 0;
  const selected: KfwResult["selected"] = [];
  for (const b of KFW_BONI) {
    if (b.locked || k[b.key]) {
      percent += b.percent;
      selected.push({ label: b.label, percent: b.percent, description: b.description });
    }
  }
  const cappedPercent = Math.min(percent, KFW_MAX_PERCENT);
  const amount = (cappedPercent / 100) * (k.foerderfaehigeKosten || 0);
  return { percent: cappedPercent, amount, selected };
}

export function parseKfwFoerderung(value: unknown): KfwFoerderung | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Partial<KfwFoerderung>;
  if (typeof v.enabled !== "boolean") return null;
  return {
    enabled: v.enabled,
    grundfoerderung: v.grundfoerderung ?? true,
    einkommensbonus: !!v.einkommensbonus,
    geschwindigkeitsbonus: !!v.geschwindigkeitsbonus,
    innovationsbonus: !!v.innovationsbonus,
    foerderfaehigeKosten:
      Number(v.foerderfaehigeKosten) ||
      DEFAULT_KFW_FOERDERUNG.foerderfaehigeKosten,
  };
}
