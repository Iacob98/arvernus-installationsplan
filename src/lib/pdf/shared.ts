import type { CompanySettings } from "@prisma/client";
import { getLogoBase64 } from "./logo";

export const DEFAULT_COMPANY: CompanySettings = {
  id: "default",
  name: "Arvernus Meisterbetrieb",
  street: "Tübinger Straße 2",
  postalCode: "10715",
  city: "Berlin",
  phone: "0123 456789",
  email: "info@arvernus-energie.de",
  website: "www.arvernus-energie.de",
  logoPath: null,
  primaryColor: "#1565C0",
  secondaryColor: "#F57C00",
  aboutText: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export function escHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function footerHtmlForCompany(company: CompanySettings): string {
  const logoSrc = getLogoBase64();
  return `<div style="width:100%;padding:0 15mm;font-family:'Segoe UI',Tahoma,sans-serif;">
    <div style="text-align:center;font-size:7pt;color:#888;margin-bottom:5px;">
      Seite <span class="pageNumber"></span>/<span class="totalPages"></span>
    </div>
    <div style="border-top:1px solid #ddd;padding-top:6px;display:flex;justify-content:space-between;font-size:6.5pt;color:#999;line-height:1.4;">
      <div style="flex:1;">
        ${logoSrc ? `<img src="${logoSrc}" style="height:18px;margin-bottom:3px;display:block;" />` : ""}
        ${escHtml(company.name)}<br>
        ${escHtml(company.street)}<br>
        ${escHtml(company.postalCode)} ${escHtml(company.city)}
      </div>
      <div style="flex:1;text-align:center;">
        ${company.phone ? escHtml(company.phone) : ""}
      </div>
      <div style="flex:1;text-align:right;">
        ${company.email ? escHtml(company.email) : ""}<br>
        ${company.website ? escHtml(company.website) : ""}
      </div>
    </div>
  </div>`;
}

export async function htmlToPdf(html: string, footerHtml: string): Promise<Buffer> {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: "<span></span>",
      footerTemplate: footerHtml,
      margin: { top: "15mm", bottom: "30mm", left: "15mm", right: "15mm" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

export async function htmlToPdfFullPage(html: string): Promise<Buffer> {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: false,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
