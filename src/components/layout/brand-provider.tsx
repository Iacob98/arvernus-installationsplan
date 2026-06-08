import { db } from "@/lib/db";

const HEX_RE = /^#?[0-9a-fA-F]{6}$/;

function sanitizeHex(input: string | null | undefined): string {
  if (!input) return "#1565c0";
  if (!HEX_RE.test(input)) return "#1565c0";
  return input.startsWith("#") ? input : `#${input}`;
}

function hexToRgba(hex: string, alpha: number): string {
  const cleaned = hex.replace("#", "");
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  const a = Math.max(0, Math.min(1, alpha));
  return `rgba(${r},${g},${b},${a})`;
}

function isDarkColor(hex: string): boolean {
  const cleaned = hex.replace("#", "");
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 160;
}

export async function BrandStyle() {
  const company = await db.companySettings.findFirst({
    select: { primaryColor: true },
  });
  const brand = sanitizeHex(company?.primaryColor);
  const brandFg = isDarkColor(brand) ? "#ffffff" : "#111111";
  const brandMuted = hexToRgba(brand, 0.1);

  // Both values are strictly validated (hex / rgb numbers) — safe to inline.
  const css = `:root{--brand:${brand};--brand-foreground:${brandFg};--brand-muted:${brandMuted};}`;
  return <style>{css}</style>;
}
