import { db } from "@/lib/db";
import { getFileBuffer } from "@/lib/storage";
import { getPdfStyles } from "./styles";
import { getLogoBase64 } from "./logo";
import {
  DEFAULT_COMPANY,
  escHtml,
  footerHtmlForCompany,
  htmlToPdf,
  htmlToPdfFullPage,
} from "./shared";
import { PDFDocument } from "pdf-lib";
import { OFFER_AGB_INTRO_HTML, OFFER_AGB_OUTRO_HTML } from "./offer-agb";
import { DEFAULT_SERVICE_ITEMS, parseServiceItems } from "@/lib/offer-service-items";
import { Prisma, CatalogItemType, OfferDiscountKind } from "@prisma/client";
import { calcHeatBalance, MONTHS_DE, parseHeatBalance } from "@/lib/heat-balance";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const offerInclude = {
  client: true,
  createdBy: { select: { name: true, email: true } },
  positions: { orderBy: { order: "asc" as const } },
  discounts: { orderBy: { order: "asc" as const } },
} satisfies Prisma.OfferInclude;

type OfferWithRelations = Prisma.OfferGetPayload<{ include: typeof offerInclude }>;
type OfferPosition = OfferWithRelations["positions"][number];
type OfferDiscount = OfferWithRelations["discounts"][number];

const TYPE_LABELS: Record<CatalogItemType, string> = {
  WAERMEPUMPE: "Wärmepumpe",
  INNENGERAET: "Innengerät",
  HEIZUNGSSPEICHER: "Heizungsspeicher",
  WARMWASSERSPEICHER: "Warmwasserspeicher",
  ANDERE: "Andere",
};

const TYPE_ORDER: CatalogItemType[] = [
  "WAERMEPUMPE",
  "INNENGERAET",
  "HEIZUNGSSPEICHER",
  "WARMWASSERSPEICHER",
  "ANDERE",
];

const VAT_RATE = 0.19;

function fmtEUR(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value);
}

function fmtDate(date: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function toNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  return Number(value.toString());
}

type Totals = {
  subtotal: number;
  appliedDiscounts: { label: string; amount: number }[];
  netto: number;
  vat: number;
  brutto: number;
  foerderungen: { label: string; amount: number }[];
  foerderungTotal: number;
};

export function calculateTotals(
  positions: Pick<OfferPosition, "unitPrice" | "quantity">[],
  discounts: Pick<OfferDiscount, "kind" | "value" | "label">[],
): Totals {
  const subtotal = positions.reduce(
    (sum, p) => sum + toNumber(p.unitPrice) * p.quantity,
    0,
  );

  let runningNetto = subtotal;
  const appliedDiscounts: Totals["appliedDiscounts"] = [];
  for (const d of discounts) {
    if (d.kind === "FOERDERUNG") continue;
    const val = toNumber(d.value);
    const amount = d.kind === "PERCENT" ? (runningNetto * val) / 100 : val;
    appliedDiscounts.push({ label: d.label, amount });
    runningNetto -= amount;
  }

  const netto = Math.max(0, runningNetto);
  const vat = netto * VAT_RATE;
  const brutto = netto + vat;

  const foerderungen = discounts
    .filter((d) => d.kind === "FOERDERUNG")
    .map((d) => ({ label: d.label, amount: toNumber(d.value) }));
  const foerderungTotal = foerderungen.reduce((sum, f) => sum + f.amount, 0);

  return { subtotal, appliedDiscounts, netto, vat, brutto, foerderungen, foerderungTotal };
}

async function loadPhotoDataUri(storagePath: string | null): Promise<string | null> {
  if (!storagePath) return null;
  try {
    const buffer = await getFileBuffer(storagePath);
    const ext = storagePath.split(".").pop()?.toLowerCase();
    const mime =
      ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : ext === "gif"
            ? "image/gif"
            : "image/jpeg";
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

function renderCoverDocument(
  offer: OfferWithRelations,
  company: { name: string; email: string | null; phone: string | null; primaryColor: string; secondaryColor: string },
  logoSrc: string | null,
  styles: string,
): string {
  const clientName = `${offer.client.firstName} ${offer.client.lastName}`.trim();
  const managerName = offer.createdBy.name || company.name;
  const managerContact = offer.createdBy.email || company.email || "";

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <style>
    ${styles}
    @page { size: A4; margin: 0; }
    html, body { margin: 0; padding: 0; height: 297mm; overflow: hidden; }
    .offer-cover-page { page-break-after: avoid; }
  </style>
</head>
<body>
  <div class="offer-cover-page">
    <div class="offer-cover-shape-top"></div>
    <div class="offer-cover-shape-mid"></div>
    <div class="offer-cover-shape-bottom"></div>

    ${
      logoSrc
        ? `<div class="offer-cover-logo"><img src="${logoSrc}" alt="${escHtml(company.name)}" /></div>`
        : `<div class="offer-cover-logo"><strong>${escHtml(company.name)}</strong></div>`
    }

    <div class="offer-cover-manager">
      <strong>${escHtml(managerName)}</strong>
      ${managerContact ? escHtml(managerContact) : ""}
    </div>

    <div class="offer-cover-title">${escHtml(offer.title)}</div>
    <div class="offer-cover-title-line"></div>
    <div class="offer-cover-subtitle">von ${escHtml(company.name)}</div>

    <div class="offer-cover-client">
      <strong>${escHtml(clientName)}</strong>
      ${offer.client.street ? `${escHtml(offer.client.street)} ${escHtml(offer.client.houseNumber)}<br>` : ""}
      ${offer.client.postalCode ? `${escHtml(offer.client.postalCode)} ${escHtml(offer.client.city)}<br>` : ""}
      ${offer.client.email ? `${escHtml(offer.client.email)}<br>` : ""}
      ${offer.client.phone ? escHtml(offer.client.phone) : ""}
    </div>
  </div>
</body>
</html>`;
}

function headerBar(
  logoSrc: string | null,
  companyName: string,
  rightLabel: string,
  rightValue: string,
): string {
  return `<div class="page-header">
    <div>${logoSrc ? `<img src="${logoSrc}" class="header-logo" alt="${escHtml(companyName)}" />` : `<span class="logo-text">${escHtml(companyName)}</span>`}</div>
    <div class="meta">
      ${
        rightLabel
          ? `<div><span class="meta-label">${escHtml(rightLabel)}</span>&nbsp;&nbsp;<span class="meta-value">${escHtml(rightValue)}</span></div>`
          : ""
      }
    </div>
  </div>`;
}

async function renderPositionsPages(
  offer: OfferWithRelations,
  company: { name: string },
  logoSrc: string | null,
  dateLabel: string,
): Promise<string> {
  const grouped = new Map<CatalogItemType, OfferPosition[]>();
  for (const p of offer.positions) {
    const arr = grouped.get(p.itemType) ?? [];
    arr.push(p);
    grouped.set(p.itemType, arr);
  }

  const photoDataUris: Record<string, string | null> = {};
  for (const p of offer.positions) {
    photoDataUris[p.id] = await loadPhotoDataUri(p.photoStoragePath);
  }

  const groupBlocks: string[] = [];
  let positionIndex = 1;

  for (const type of TYPE_ORDER) {
    const list = grouped.get(type);
    if (!list || list.length === 0) continue;

    const positionsHtml = list
      .map((p) => {
        const techList =
          Array.isArray(p.technicalData) && p.technicalData.length > 0
            ? `<ul class="offer-tech-list">${(p.technicalData as { key: string; value: string }[])
                .map(
                  (t) =>
                    `<li><strong>${escHtml(String(t.key))}:</strong> ${escHtml(String(t.value))}</li>`,
                )
                .join("")}</ul>`
            : "";

        const photoSrc = photoDataUris[p.id];
        const photoHtml = photoSrc
          ? `<img src="${photoSrc}" class="offer-position-photo" alt="" />`
          : "";

        const desc = p.description
          ? `<p>${escHtml(p.description).replace(/\n/g, "<br>")}</p>`
          : "";

        const num = positionIndex++;

        return `<div class="offer-position">
          <div class="offer-position-head">
            <div style="display:flex;align-items:center;flex:1;">
              <span class="offer-position-number">${num}</span>
              <span class="offer-position-title">${escHtml(p.name)}</span>
            </div>
            <div class="offer-position-qty">${p.manufacturer ? escHtml(p.manufacturer) + " | " : ""}${p.quantity} Stück</div>
          </div>
          <div class="offer-position-body">
            <div class="offer-position-text">
              ${desc}
              ${techList}
            </div>
            ${photoHtml}
          </div>
        </div>`;
      })
      .join("");

    groupBlocks.push(`<div class="offer-page">
      ${headerBar(logoSrc, company.name, "", "")}
      <div class="offer-page-date">${escHtml(dateLabel)}</div>
      <div class="offer-page-heading">${escHtml(TYPE_LABELS[type])}</div>
      <div class="offer-page-sub">Hier sehen Sie die Details der ${escHtml(TYPE_LABELS[type])}-Komponenten.</div>
      <div class="offer-section-label">Verbaute Komponenten</div>
      ${positionsHtml}
    </div>`);
  }

  return groupBlocks.join("\n");
}

function renderSummaryPage(
  offer: OfferWithRelations,
  totals: Totals,
  company: { name: string },
  logoSrc: string | null,
  dateLabel: string,
): string {
  const rows = offer.positions
    .map(
      (p) => `<tr>
      <td>${escHtml(p.name)}</td>
      <td>${escHtml(TYPE_LABELS[p.itemType])}</td>
      <td class="num">${p.quantity} Stück</td>
    </tr>`,
    )
    .join("");

  const discountRows = totals.appliedDiscounts
    .map(
      (d) =>
        `<div class="row discount"><span>${escHtml(d.label)}</span><span>- ${fmtEUR(d.amount)}</span></div>`,
    )
    .join("");

  const foerderRows = totals.foerderungen
    .map(
      (f) =>
        `<div class="row"><span>${escHtml(f.label)}</span><span>- ${fmtEUR(f.amount)}</span></div>`,
    )
    .join("");

  return `<div class="offer-page">
    ${headerBar(logoSrc, company.name, "", "")}
    <div class="offer-page-date">${escHtml(dateLabel)}</div>
    <div class="offer-page-heading">Bestandteile Ihres Angebots</div>
    <div class="offer-page-sub">Hier sehen Sie alle Komponenten &amp; Dienstleistungen, die wir Ihnen im Rahmen Ihres Angebots anbieten.</div>

    <table class="offer-summary-table">
      <thead>
        <tr><th>Name</th><th>Typ</th><th class="num">Anzahl</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="offer-totals">
      <div class="row label"><span>Zwischensumme</span><span>${fmtEUR(totals.subtotal)}</span></div>
      ${discountRows}
      <div class="row label"><span>Gesamt (Netto)</span><span>${fmtEUR(totals.netto)}</span></div>
      <div class="row label"><span>MwSt. (${(VAT_RATE * 100).toFixed(1).replace(".", ",")} % auf ${fmtEUR(totals.netto)})</span><span>${fmtEUR(totals.vat)}</span></div>
      <div class="row total"><span>Gesamt (Brutto)</span><span>${fmtEUR(totals.brutto)}</span></div>
    </div>

    ${
      totals.foerderungen.length > 0
        ? `<div class="offer-foerderung-note">
            <div class="offer-section-label">Voraussichtliche Förderungen *</div>
            ${foerderRows}
            <div class="star">* Die Gewährung von Förderungen ist grundsätzlich von einer sorgfältigen Prüfung der Voraussetzungen und der ordnungsgemäßen Einreichung der erforderlichen Unterlagen abhängig und kann nicht garantiert werden.</div>
          </div>`
        : ""
    }
  </div>`;
}

const ABOUT_TITLE = "Meisterbetrieb mit Leidenschaft — seit 2014";
const ABOUT_PARAGRAPHS = [
  "Als inhabergeführter Meisterbetrieb stehen wir seit über einem Jahrzehnt für höchste Qualität bei der Installation von Wärmepumpen und Photovoltaikanlagen. Unser erfahrenes Team aus zertifizierten Fachkräften begleitet Sie von der ersten Beratung bis zur fertigen Anlage — persönlich, zuverlässig und mit echtem Engagement.",
  "Was uns antreibt? Die Überzeugung, dass nachhaltige Energie für jeden zugänglich sein sollte. Deshalb setzen wir auf faire Preise, modernste Technik und einen Service, der keine Wünsche offen lässt.",
];

async function loadTeamPhotoDataUri(): Promise<string | null> {
  try {
    const path = join(process.cwd(), "public", "team.png");
    const buffer = await readFile(path);
    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

async function renderAboutPage(
  company: { name: string },
  logoSrc: string | null,
  dateLabel: string,
): Promise<string> {
  const teamPhoto = await loadTeamPhotoDataUri();
  const paragraphs = ABOUT_PARAGRAPHS.map(
    (p) => `<p style="margin-bottom:10px;">${escHtml(p)}</p>`,
  ).join("");

  return `<div class="offer-page">
    ${headerBar(logoSrc, company.name, "", "")}
    <div class="offer-page-date">${escHtml(dateLabel)}</div>
    <div class="offer-page-heading">${escHtml(ABOUT_TITLE)}</div>
    <div class="offer-page-sub">Das sind wir</div>

    <div style="font-size:10pt;line-height:1.6;color:#333;margin-top:10px;">
      ${paragraphs}
    </div>

    ${
      teamPhoto
        ? `<div style="margin-top:18px;">
            <img src="${teamPhoto}" alt="${escHtml(company.name)} Team" style="width:100%;border-radius:8px;display:block;" />
          </div>`
        : ""
    }
  </div>`;
}

function renderHeatBalancePage(
  offer: OfferWithRelations,
  company: { name: string; primaryColor: string; secondaryColor: string },
  logoSrc: string | null,
  dateLabel: string,
): string {
  const hb = parseHeatBalance(offer.heatBalance);
  if (!hb || !hb.enabled) return "";

  const result = calcHeatBalance(hb);
  const primary = company.primaryColor;
  const colors = { grid: "#1f2937", pv: "#f59e0b", buffer: "#10b981" };

  const chart = renderBarChartSvg(result.monthly, result.maxMonthlyKwh, colors);

  const before = fmtEUR(result.costBefore);
  const after = fmtEUR(result.costAfter);
  const kwhBefore = Math.round(result.kwhBefore).toLocaleString("de-DE");
  const kwhAfter = Math.round(result.kwhAfter).toLocaleString("de-DE");

  return `<div class="offer-page">
    ${headerBar(logoSrc, company.name, "", "")}
    <div class="offer-page-date">${escHtml(dateLabel)}</div>
    <div class="offer-page-heading">Ihr Wärmehaushalt</div>
    <div class="offer-page-sub">Hier sehen Sie, woher Ihre Wärmepumpe über das Jahr den Strom bezieht.</div>

    <div style="border:1px solid #eee;border-radius:8px;padding:14px;margin-top:10px;">
      ${chart}
      <div style="display:flex;gap:18px;margin-top:10px;font-size:9pt;color:#555;">
        <div style="display:flex;align-items:center;gap:6px;"><span style="display:inline-block;width:10px;height:10px;background:${colors.grid};border-radius:2px;"></span> Aus dem Netz</div>
        <div style="display:flex;align-items:center;gap:6px;"><span style="display:inline-block;width:10px;height:10px;background:${colors.pv};border-radius:2px;"></span> Aus der PV-Anlage</div>
        <div style="display:flex;align-items:center;gap:6px;"><span style="display:inline-block;width:10px;height:10px;background:${colors.buffer};border-radius:2px;"></span> Aus dem Speicher</div>
      </div>
    </div>

    <div style="margin-top:24px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #eee;padding-bottom:14px;">
      <div>
        <div style="font-size:14pt;font-weight:600;color:#111;">Heizkostenprognose</div>
        <div style="font-size:9pt;color:#666;">Jährliche Heizkosten mit und ohne eigene Wärmepumpe</div>
        <div style="font-size:8.5pt;color:#999;">Geschätzter Jahresdurchschnitt über die nächsten 20 Jahre</div>
      </div>
      <div style="font-size:14pt;font-weight:700;">
        ${escHtml(before)} <span style="color:#888;">»</span> <span style="color:${primary};">${escHtml(after)}</span>
      </div>
    </div>

    <div style="margin-top:14px;display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-size:14pt;font-weight:600;color:#111;">Effizienz Ihrer Heizung</div>
        <div style="font-size:9pt;color:#666;max-width:120mm;">Die Energiemenge, die benötigt wird, um Ihr Gebäude ein Jahr lang zu heizen. Im Vergleich zu einer Öl- oder Gasheizung kann eine Wärmepumpe deutlich mehr Wärme pro eingesetzter Energieeinheit erzeugen.</div>
      </div>
      <div style="font-size:14pt;font-weight:700;white-space:nowrap;">
        ${escHtml(kwhBefore)} kWh <span style="color:#888;">»</span> <span style="color:${primary};">${escHtml(kwhAfter)} kWh</span>
      </div>
    </div>
  </div>`;
}

function renderBarChartSvg(
  monthly: { month: string; fromGrid: number; fromPv: number; fromBuffer: number; total: number }[],
  maxKwh: number,
  colors: { grid: string; pv: string; buffer: string },
): string {
  const width = 540;
  const height = 220;
  const padL = 50;
  const padR = 10;
  const padT = 10;
  const padB = 28;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const barW = innerW / monthly.length;
  const max = Math.max(maxKwh, 1);

  // Round max to a nice value for grid lines
  const niceMax = niceCeil(max);
  const steps = 5;

  const gridLines = Array.from({ length: steps + 1 }, (_, i) => {
    const v = (niceMax * i) / steps;
    const y = padT + innerH - (v / niceMax) * innerH;
    return `<line x1="${padL}" y1="${y}" x2="${width - padR}" y2="${y}" stroke="#eee" stroke-width="1"/>
            <text x="${padL - 6}" y="${y + 3}" text-anchor="end" font-size="8" fill="#888">${Math.round(v).toLocaleString("de-DE")} kWh</text>`;
  }).join("");

  const bars = monthly
    .map((m, i) => {
      const x = padL + i * barW + barW * 0.15;
      const w = barW * 0.7;
      const hTotal = (m.total / niceMax) * innerH;
      const hGrid = (m.fromGrid / niceMax) * innerH;
      const hPv = (m.fromPv / niceMax) * innerH;
      const hBuf = (m.fromBuffer / niceMax) * innerH;
      const yBase = padT + innerH;
      const yGrid = yBase - hGrid;
      const yPv = yGrid - hPv;
      const yBuf = yPv - hBuf;
      void hTotal;
      const monthLabel = m.month.slice(0, 3);
      return `
        <rect x="${x}" y="${yGrid}" width="${w}" height="${hGrid}" fill="${colors.grid}"/>
        <rect x="${x}" y="${yPv}" width="${w}" height="${hPv}" fill="${colors.pv}"/>
        <rect x="${x}" y="${yBuf}" width="${w}" height="${hBuf}" fill="${colors.buffer}"/>
        <text x="${x + w / 2}" y="${yBase + 14}" text-anchor="middle" font-size="8" fill="#666">${monthLabel}</text>`;
    })
    .join("");

  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;">
    ${gridLines}
    ${bars}
  </svg>`;
}

function niceCeil(value: number): number {
  if (value <= 0) return 1;
  const exp = Math.floor(Math.log10(value));
  const base = Math.pow(10, exp);
  const m = value / base;
  let nice: number;
  if (m <= 1) nice = 1;
  else if (m <= 1.5) nice = 1.5;
  else if (m <= 2) nice = 2;
  else if (m <= 3) nice = 3;
  else if (m <= 5) nice = 5;
  else nice = 10;
  return nice * base;
}

function renderFoerderungPage(
  offer: OfferWithRelations,
  totals: Totals,
  company: { name: string; primaryColor: string },
  logoSrc: string | null,
  dateLabel: string,
): string {
  const foerderungen = offer.discounts.filter((d) => d.kind === "FOERDERUNG");
  if (foerderungen.length === 0) return "";

  const totalAmount = totals.foerderungTotal;
  const primary = company.primaryColor;

  const fallback =
    "Voraussichtlicher Zuschuss. Die Gewährung dieser Förderung ist von einer sorgfältigen Prüfung der Voraussetzungen und der ordnungsgemäßen Einreichung der erforderlichen Unterlagen abhängig.";

  const items = foerderungen
    .map((d) => {
      const amount = toNumber(d.value);
      const desc = d.description?.trim() ? d.description : fallback;
      const descHtml = escHtml(desc).replace(/\n/g, "<br>");
      return `<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:18px;padding:16px 0;border-top:1px solid #eee;page-break-inside:avoid;">
        <div style="flex:1;">
          <div style="font-size:12pt;font-weight:600;color:#111;margin-bottom:6px;">
            ${escHtml(d.label)}
          </div>
          <div style="font-size:9.5pt;color:#555;line-height:1.55;">
            ${descHtml}
          </div>
        </div>
        <div style="width:55mm;border:1px solid #eee;border-radius:8px;padding:14px;text-align:center;flex-shrink:0;">
          <div style="font-size:8pt;color:#888;text-transform:uppercase;letter-spacing:0.06em;">Betrag</div>
          <div style="font-size:18pt;font-weight:700;color:${primary};margin:6px 0;">
            ${fmtEUR(amount)}
          </div>
          <div style="font-size:9pt;color:#555;">${escHtml(d.label)}</div>
        </div>
      </div>`;
    })
    .join("");

  return `<div class="offer-page">
    ${headerBar(logoSrc, company.name, "", "")}
    <div class="offer-page-date">${escHtml(dateLabel)}</div>
    <div class="offer-page-heading">Ihre Förderungen</div>
    <div class="offer-page-sub">Hier sehen Sie die Förderungen, die bei Ihrer Planung berücksichtigt werden. Diese Förderungen beeinflussen das Ergebnis der Wirtschaftlichkeitsberechnung. Der Erhalt von Fördermitteln kann nicht garantiert werden. Die Gewährung von Zuschüssen ist grundsätzlich von einer sorgfältigen Prüfung der Voraussetzungen und der ordnungsgemäßen Einreichung der erforderlichen Unterlagen abhängig.</div>

    <div style="margin-top:10px;">
      ${items}
    </div>

    <div style="margin-top:28px;display:flex;justify-content:space-between;align-items:flex-end;border-top:2px solid #111;padding-top:14px;">
      <div>
        <div style="font-size:14pt;font-weight:700;color:#111;">Voraussichtlicher Gesamtbetrag der Förderung</div>
        <div style="font-size:9pt;color:#666;">Dieser Betrag fließt in die Berechnung der Wirtschaftlichkeit ein.</div>
      </div>
      <div style="font-size:18pt;font-weight:700;color:#111;white-space:nowrap;">
        ${fmtEUR(totalAmount)}
      </div>
    </div>
  </div>`;
}

function renderAgbPage(
  offer: OfferWithRelations,
  company: { name: string },
  logoSrc: string | null,
  dateLabel: string,
): string {
  const items =
    parseServiceItems(offer.serviceItems) ?? DEFAULT_SERVICE_ITEMS;
  const itemsHtml =
    items.length > 0
      ? `<ul>${items.map((i) => `<li>${escHtml(i)}</li>`).join("")}</ul>`
      : "";

  return `<div class="offer-page">
    ${headerBar(logoSrc, company.name, "", "")}
    <div class="offer-page-date">${escHtml(dateLabel)}</div>
    <div class="offer-page-heading">Angebot akzeptieren</div>
    <div class="offer-agb-block">
      ${OFFER_AGB_INTRO_HTML}
      ${items.length > 0 ? `<h3>Leistungsumfang Wärmepumpe</h3>${itemsHtml}` : ""}
      ${OFFER_AGB_OUTRO_HTML}
    </div>
  </div>`;
}

function renderSignaturePage(
  offer: OfferWithRelations,
  company: { name: string },
  logoSrc: string | null,
  dateLabel: string,
): string {
  const weeks = Math.round(offer.validUntilDays / 7);
  const clientName = `${offer.client.firstName} ${offer.client.lastName}`.trim();
  const address = [
    offer.client.street && offer.client.houseNumber
      ? `${offer.client.street} ${offer.client.houseNumber}`
      : "",
    offer.client.postalCode && offer.client.city
      ? `${offer.client.postalCode} ${offer.client.city}`
      : "",
  ]
    .filter(Boolean)
    .join(", ");

  return `<div class="offer-page">
    ${headerBar(logoSrc, company.name, "", "")}
    <div class="offer-page-date">${escHtml(dateLabel)}</div>
    <div class="offer-page-heading">Ihre Zustimmung</div>
    <div class="offer-page-sub">Das Angebot ist befristet auf ${weeks} Wochen nach Erhalt.</div>

    <div style="margin-top:14mm;display:grid;grid-template-columns:1fr 1fr;gap:14mm;">
      <div>
        <div style="font-size:9pt;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">Kunde</div>
        <div style="font-size:11pt;color:#111;font-weight:600;">${escHtml(clientName)}</div>
        ${address ? `<div style="font-size:9.5pt;color:#555;margin-top:2px;">${escHtml(address)}</div>` : ""}
      </div>
      <div>
        <div style="font-size:9pt;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">Anbieter</div>
        <div style="font-size:11pt;color:#111;font-weight:600;">${escHtml(company.name)}</div>
        <div style="font-size:9.5pt;color:#555;margin-top:2px;">${escHtml(offer.createdBy.name)}</div>
      </div>
    </div>

    <div style="margin-top:22mm;display:grid;grid-template-columns:1fr 1fr;gap:14mm;">
      <div>
        <div style="border-top:1px solid #333;padding-top:8px;font-size:9pt;color:#666;">
          Ort, Datum
        </div>
      </div>
      <div>
        <div style="border-top:1px solid #333;padding-top:8px;font-size:9pt;color:#666;">
          Unterschrift Kunde
        </div>
      </div>
    </div>

    <div style="margin-top:18mm;border-top:1px solid #eee;padding-top:12px;">
      <h3 style="font-size:11pt;color:#111;margin-bottom:6px;">KfW aufschiebende Bedingung</h3>
      <p style="font-size:8.5pt;color:#666;line-height:1.55;">
        Dieser Vertrag tritt hinsichtlich der Liefer- und Leistungspflichten zur Umsetzung erst und nur insoweit in Kraft, wenn und soweit die KfW den Antrag auf Förderung aus dem Produkt 458 bewilligt und die Förderung mit einer Zusage gegenüber der antragstellenden Vertragspartei zugesagt hat. Die antragstellende Vertragspartei wird die jeweils andere Vertragspartei über den Eintritt und den Umfang des Eintritts der Bedingung unverzüglich in Kenntnis setzen.
      </p>
    </div>
  </div>`;
}

async function buildOfferDocuments(offerId: string): Promise<{
  coverHtml: string;
  bodyHtml: string;
  footer: string;
}> {
  const offer = await db.offer.findUnique({
    where: { id: offerId },
    include: offerInclude,
  });
  if (!offer) throw new Error("Offer not found");

  const company = (await db.companySettings.findFirst()) ?? DEFAULT_COMPANY;
  const styles = getPdfStyles(company.primaryColor, company.secondaryColor);
  const logoSrc = getLogoBase64();
  const dateLabel = fmtDate(offer.createdAt);
  const totals = calculateTotals(offer.positions, offer.discounts);

  const coverHtml = renderCoverDocument(offer, company, logoSrc, styles);

  const about = await renderAboutPage(company, logoSrc, dateLabel);
  const positions = await renderPositionsPages(offer, company, logoSrc, dateLabel);
  const heatBalancePage = renderHeatBalancePage(offer, company, logoSrc, dateLabel);
  const foerderungPage = renderFoerderungPage(offer, totals, company, logoSrc, dateLabel);
  const summary = renderSummaryPage(offer, totals, company, logoSrc, dateLabel);
  const agb = renderAgbPage(offer, company, logoSrc, dateLabel);
  const signature = renderSignaturePage(offer, company, logoSrc, dateLabel);

  const bodyHtml = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <style>${styles}</style>
</head>
<body>
  ${about}
  ${positions}
  ${heatBalancePage}
  ${foerderungPage}
  ${summary}
  ${agb}
  ${signature}
</body>
</html>`;

  return { coverHtml, bodyHtml, footer: footerHtmlForCompany(company) };
}

export async function renderOfferHtml(offerId: string): Promise<{ html: string; footer: string }> {
  const { coverHtml, bodyHtml, footer } = await buildOfferDocuments(offerId);
  return { html: coverHtml + bodyHtml, footer };
}

export async function renderOfferPdf(offerId: string): Promise<Buffer> {
  const { coverHtml, bodyHtml, footer } = await buildOfferDocuments(offerId);
  const [coverPdf, bodyPdf] = await Promise.all([
    htmlToPdfFullPage(coverHtml),
    htmlToPdf(bodyHtml, footer),
  ]);
  return mergePdfs([coverPdf, bodyPdf]);
}

async function mergePdfs(buffers: Buffer[]): Promise<Buffer> {
  const out = await PDFDocument.create();
  for (const buf of buffers) {
    const doc = await PDFDocument.load(buf);
    const pages = await out.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => out.addPage(p));
  }
  const bytes = await out.save();
  return Buffer.from(bytes);
}

export const OFFER_TYPE_LABELS = TYPE_LABELS;
export const OFFER_DISCOUNT_LABEL: Record<OfferDiscountKind, string> = {
  PERCENT: "Rabatt %",
  AMOUNT: "Rabatt €",
  FOERDERUNG: "Förderung",
};
