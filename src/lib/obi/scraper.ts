import type { Browser, BrowserContext, Page } from "playwright";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ObiListItem } from "./types";

const BASE = "https://partnercenter.obi.de";

function cfg() {
  const orgId = process.env.OBI_PROJECT_ID;
  const user = process.env.OBI_USER;
  const pass = process.env.OBI_PASS;
  if (!orgId || !user || !pass) {
    throw new Error("OBI_PROJECT_ID / OBI_USER / OBI_PASS must be set in the environment");
  }
  const statePath = process.env.OBI_STORAGE_STATE_PATH || join(process.cwd(), ".obi-session.json");
  return { orgId, user, pass, statePath };
}

function listUrl(orgId: string): string {
  return `${BASE}/app/projects/${orgId}?stateTag=active`;
}

export interface ObiSession {
  browser: Browser;
  context: BrowserContext;
  page: Page;
  orgId: string;
  close: () => Promise<void>;
}

async function dismissCookieBanner(page: Page): Promise<void> {
  for (const label of ["Alle akzeptieren", "Akzeptieren", "Accept All"]) {
    const b = page.locator(`button:has-text("${label}")`).first();
    if (await b.count().catch(() => 0)) {
      await b.click().catch(() => {});
      await page.waitForTimeout(800);
      return;
    }
  }
}

/** True if we're sitting on the Keycloak login form. */
async function needsLogin(page: Page): Promise<boolean> {
  if (/auth\.obi\.com/.test(page.url())) return true;
  return (await page.locator("#username, input[name=username]").count().catch(() => 0)) > 0;
}

async function doLogin(page: Page, user: string, pass: string): Promise<void> {
  await page.locator("#username, input[name=username]").first().fill(user);
  const pw = page.locator("#password, input[name=password]").first();
  if (await pw.count()) await pw.fill(pass);
  await Promise.all([
    page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {}),
    page.locator("#kc-login, button[type=submit], input[type=submit]").first().click().catch(() => {}),
  ]);
  await page.waitForTimeout(3000);
  // Possible second step (password on its own page)
  const pw2 = page.locator("#password, input[name=password]").first();
  if ((await pw2.count()) && !(await pw2.inputValue().catch(() => "x"))) {
    await pw2.fill(pass);
    await page.locator("#kc-login, button[type=submit]").first().click().catch(() => {});
    await page.waitForTimeout(3000);
  }
  if (await needsLogin(page)) {
    throw new Error("OBI login failed — still on the auth form (check credentials / MFA)");
  }
}

/** Launch a browser, restore/refresh the session, and land on the active-projects list. */
export async function openObiSession(): Promise<ObiSession> {
  const { orgId, user, pass, statePath } = cfg();
  const { chromium } = await import("playwright");
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  const context = await browser.newContext({
    storageState: existsSync(statePath) ? statePath : undefined,
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    viewport: { width: 1440, height: 1200 },
    locale: "de-DE",
  });
  const page = await context.newPage();

  await page.goto(listUrl(orgId), { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2500);
  await dismissCookieBanner(page);

  if (await needsLogin(page)) {
    await doLogin(page, user, pass);
    await context.storageState({ path: statePath }); // persist for next run
    await page.goto(listUrl(orgId), { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(2000);
    await dismissCookieBanner(page);
  }

  return {
    browser,
    context,
    page,
    orgId,
    close: async () => {
      await context.storageState({ path: statePath }).catch(() => {});
      await browser.close().catch(() => {});
    },
  };
}

const CARD_EVAL = `(() => {
  const codeRe = /^DE[0-9]+L[0-9]+_[0-9]+$/;
  const ps = Array.from(document.querySelectorAll('p'));
  const out = [];
  const seen = new Set();
  for (const p of ps) {
    const code = (p.textContent || '').trim();
    if (!codeRe.test(code) || seen.has(code)) continue;
    seen.add(code);
    // climb to the FULL card box: the smallest ancestor holding both a phone
    // link and the "Aktualisieren" action (so the top status badge is included).
    let card = p;
    for (let i = 0; i < 10 && card.parentElement; i++) {
      card = card.parentElement;
      if (card.querySelector('a[href^="tel:"]') && /Aktualisieren/.test(card.textContent || '')) break;
    }
    const lines = (card.innerText || '').split('\\n').map(s => s.trim()).filter(Boolean);
    const idx = lines.indexOf(code);
    const rawName = idx >= 0 && lines[idx + 1] ? lines[idx + 1] : '';
    const tel = card.querySelector('a[href^="tel:"]');
    const phone = tel ? (tel.getAttribute('href') || '').replace(/^tel:/, '') : '';
    const ageText = lines.find(l => /^Seit /.test(l)) || '';
    // status badge sits above the age line / code; take the line before the age.
    const ageIdx = ageText ? lines.indexOf(ageText) : -1;
    const status = ageIdx > 0 ? lines[ageIdx - 1] : (idx > 0 ? lines[idx - 1] : '');
    out.push({ externalId: code, rawName, phone, status, ageText });
  }
  return out;
})()`;

function scrapeVisibleCards(page: Page): Promise<ObiListItem[]> {
  return page.evaluate(CARD_EVAL) as Promise<ObiListItem[]>;
}

/** Largest page number currently exposed by the numeric pager buttons. */
async function maxVisiblePage(page: Page): Promise<number> {
  const nums = (await page
    .locator('button[type="button"]')
    .evaluateAll((els) =>
      els.map((e) => (e.textContent || "").trim()).filter((t) => /^\d+$/.test(t)).map(Number),
    )
    .catch(() => [])) as number[];
  return nums.length ? Math.max(...nums) : 1;
}

/**
 * Walk every page of the active-projects grid and collect all cards.
 * Pagination is client-side numeric buttons ("1".."N", middle pages collapse to
 * "…"); we click them in sequence, which keeps revealing the next number.
 */
export async function scrapeAllListItems(page: Page, maxPages = 40): Promise<ObiListItem[]> {
  const all: ObiListItem[] = [];
  const seen = new Set<string>();

  const collect = (cards: ObiListItem[], pageNum: number) => {
    let added = 0;
    for (const c of cards) {
      if (!seen.has(c.externalId)) {
        seen.add(c.externalId);
        all.push({ ...c, pageNum });
        added++;
      }
    }
    return added;
  };

  await page.waitForTimeout(1000);
  collect(await scrapeVisibleCards(page), 1);

  for (let target = 2; target <= maxPages; target++) {
    if (target > (await maxVisiblePage(page))) break; // no more pages
    let btn = page.locator(`button[type="button"]:text-is("${target}")`).first();
    if (!(await btn.count().catch(() => 0))) {
      // target hidden behind "…" — advance the window via the largest visible number
      const mv = await maxVisiblePage(page);
      const jump = page.locator(`button[type="button"]:text-is("${mv}")`).first();
      if (await jump.count().catch(() => 0)) {
        await jump.click().catch(() => {});
        await page.waitForTimeout(1500);
      }
      btn = page.locator(`button[type="button"]:text-is("${target}")`).first();
      if (!(await btn.count().catch(() => 0))) continue;
    }
    const firstBefore = (await scrapeVisibleCards(page))[0]?.externalId ?? "";
    await btn.click().catch(() => {});
    await page.waitForTimeout(1600);
    const cards = await scrapeVisibleCards(page);
    if ((cards[0]?.externalId ?? "") === firstBefore) {
      // page didn't change; one more short wait then re-check
      await page.waitForTimeout(1200);
    }
    collect(await scrapeVisibleCards(page), target);
  }
  return all;
}

/** Go to list page 1 (fresh nav) then click forward to page `n` (1-based). */
export async function gotoListPage(page: Page, orgId: string, n: number): Promise<void> {
  await page.goto(listUrl(orgId), { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(1500);
  await dismissCookieBanner(page);
  for (let target = 2; target <= n; target++) {
    const btn = page.locator(`button[type="button"]:text-is("${target}")`).first();
    if (!(await btn.count().catch(() => 0))) {
      const mv = await maxVisiblePage(page);
      await page.locator(`button[type="button"]:text-is("${mv}")`).first().click().catch(() => {});
      await page.waitForTimeout(1400);
      continue;
    }
    await btn.click().catch(() => {});
    await page.waitForTimeout(1400);
  }
}

/**
 * Open a lead's detail page by clicking its "Details öffnen" button (the card
 * must be visible on the current list page) and return the detail innerText.
 * Does NOT navigate back — the caller restores the list position.
 * Returns null if the card isn't on the current page.
 */
export async function openLeadDetailText(page: Page, externalId: string): Promise<string | null> {
  const codeP = page.locator(`p:text-is("${externalId}")`).first();
  if (!(await codeP.count().catch(() => 0))) return null;
  const card = codeP.locator('xpath=ancestor::*[.//button[@aria-label="Details öffnen"]][1]');
  const btn = card.locator('button[aria-label="Details öffnen"]').first();
  if (!(await btn.count().catch(() => 0))) return null;

  await btn.click().catch(() => {});
  await page.waitForURL(/\/app\/project\//, { timeout: 20000 }).catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1200);
  const text = await page.evaluate(`document.body.innerText`).catch(() => "");
  return String(text || "");
}

/** Return to the list at page `n` after a detail view: try history back, else re-navigate. */
export async function returnToListPage(page: Page, orgId: string, n: number): Promise<void> {
  await page.goBack({ waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1200);
  // Verify we're on a list page showing cards; if pagination was lost, re-navigate.
  const onList = (await page.locator('button[aria-label="Details öffnen"]').count().catch(() => 0)) > 0;
  if (!onList) {
    await gotoListPage(page, orgId, n);
  }
}
