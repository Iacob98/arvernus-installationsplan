# Saniert-Frage im Heizlast-Kalkulator — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Saniert?" (Ja / Nein / Ja, 50%) question after Baujahr in the Angebot wizard that scales the area-based Heizlast (kW) recommendation.

**Architecture:** `saniert` becomes a nullable string column on `Client`, flows through the existing inquiry plumbing (Zod schemas → wizard form → `calcHeizlast`). The pure `calcHeizlast` function multiplies only the area-method specific heat load by a research-backed factor (Nein ×1.0, Ja 50% ×0.70, Ja ×0.50); the consumption method is untouched.

**Tech Stack:** Next.js 16, React 19, Prisma/Postgres, Zod, react-hook-form. No unit-test framework in repo → the pure function gets a dependency-free `tsx` + `node:assert` test; everything else is verified via `tsc`/build.

**Spec:** `docs/superpowers/specs/2026-06-16-saniert-frage-heizlast-design.md`

---

### Task 1: Core calc — `saniert` factor in `calcHeizlast`

**Files:**
- Modify: `src/lib/heizlast.ts`
- Test: `src/lib/heizlast.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `src/lib/heizlast.test.ts`:

```ts
import assert from "node:assert/strict";
import { calcHeizlast } from "./heizlast";

// area-only base: 150 m² × 100 W/m² (1978–1994) = 15.0 kW
const base = calcHeizlast({ wohnflaecheM2: 150, baujahr: "1978–1994" });
assert.equal(base.heizlastByArea, 15);

// Nein → ×1.0
const nein = calcHeizlast({ wohnflaecheM2: 150, baujahr: "1978–1994", saniert: "Nein" });
assert.equal(nein.heizlastByArea, 15);

// Ja, 50% → ×0.70 = 10.5
const teil = calcHeizlast({ wohnflaecheM2: 150, baujahr: "1978–1994", saniert: "Ja, 50%" });
assert.equal(teil.heizlastByArea, 10.5);

// Ja → ×0.50 = 7.5
const voll = calcHeizlast({ wohnflaecheM2: 150, baujahr: "1978–1994", saniert: "Ja" });
assert.equal(voll.heizlastByArea, 7.5);

// null/unknown → ×1.0 (backwards compatible)
const none = calcHeizlast({ wohnflaecheM2: 150, baujahr: "1978–1994", saniert: null });
assert.equal(none.heizlastByArea, 15);

// consumption method is NOT affected by saniert
const cons = calcHeizlast({ jahresverbrauchKwh: 21000, saniert: "Ja" });
const consNo = calcHeizlast({ jahresverbrauchKwh: 21000 });
assert.equal(cons.heizlastByConsumption, consNo.heizlastByConsumption);

console.log("✓ heizlast saniert tests passed");
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx tsx src/lib/heizlast.test.ts`
Expected: FAIL — TypeScript error that `saniert` is not a known property of `HeizlastInput` (object literal may only specify known properties).

- [ ] **Step 3: Add the constants, type, and factor in `src/lib/heizlast.ts`**

Right after the `BaujahrChip` type export (the line `export type BaujahrChip = (typeof BAUJAHR_CHIPS)[number];`), add:

```ts
/**
 * Sanierungszustand des Gebäudes. Die Werte in SPEZ_HEIZLAST entsprechen der
 * unsanierten Baseline je Baualtersklasse; Sanierung senkt die spezifische
 * Heizlast. Faktoren abgeleitet aus deutschen Richtwerten
 * (unsaniert ≈150 / teilsaniert ≈100 / saniert ≈70 W/m²).
 */
export const SANIERT_CHIPS = ["Nein", "Ja, 50%", "Ja"] as const;

export type SaniertChip = (typeof SANIERT_CHIPS)[number];

const SANIERT_FACTOR: Record<SaniertChip, number> = {
  "Nein": 1.0,
  "Ja, 50%": 0.7,
  "Ja": 0.5,
};
```

In the `HeizlastInput` type, add the `saniert` field (after the `baujahr` line):

```ts
  baujahr?: BaujahrChip | null;
  saniert?: SaniertChip | null;
```

- [ ] **Step 4: Apply the factor to the area method**

In `calcHeizlast`, find:

```ts
  const spez = input.baujahr ? SPEZ_HEIZLAST[input.baujahr] : null;

  const heizlastByArea = wohn > 0 && spez ? (wohn * spez) / 1000 : null;
```

Replace with:

```ts
  const spez = input.baujahr ? SPEZ_HEIZLAST[input.baujahr] : null;
  const sanierFactor = input.saniert ? (SANIERT_FACTOR[input.saniert] ?? 1) : 1;

  const heizlastByArea =
    wohn > 0 && spez ? (wohn * spez * sanierFactor) / 1000 : null;
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npx tsx src/lib/heizlast.test.ts`
Expected: `✓ heizlast saniert tests passed` and exit code 0.

- [ ] **Step 6: Commit**

```bash
git add src/lib/heizlast.ts src/lib/heizlast.test.ts
git commit -m "feat: saniert factor in Heizlast area calculation"
```

---

### Task 2: Database — `Client.saniert` column

**Files:**
- Modify: `prisma/schema.prisma`
- Create: migration under `prisma/migrations/`

> **Note:** requires a running Postgres (`DATABASE_URL`). If the DB is not reachable, start it first (see project env), then run the migration.

- [ ] **Step 1: Add the column**

In `prisma/schema.prisma`, in `model Client`, find:

```prisma
  constructionYear String?
```

Add directly below it:

```prisma
  constructionYear String?
  saniert          String?
```

- [ ] **Step 2: Create and apply the migration**

Run: `npx prisma migrate dev --name add_client_saniert`
Expected: a new migration folder `prisma/migrations/<timestamp>_add_client_saniert/` is created, applied, and the Prisma Client is regenerated.

- [ ] **Step 3: Verify the type is generated**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: no new errors referencing `saniert` (the column now exists on the generated `Client` type).

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add Client.saniert column"
```

---

### Task 3: Validation schemas — accept `saniert`

**Files:**
- Modify: `src/lib/validations/offer.ts`
- Modify: `src/lib/validations/client.ts`

- [ ] **Step 1: Offer inquiry schema**

In `src/lib/validations/offer.ts`, in `offerInquirySchema`, find:

```ts
  constructionYear: z.string().nullable().optional(),
```

Add directly below it:

```ts
  constructionYear: z.string().nullable().optional(),
  saniert: z.string().nullable().optional(),
```

- [ ] **Step 2: Client schema**

In `src/lib/validations/client.ts`, in the client schema object, find:

```ts
  constructionYear: z.string().nullable().optional(),
```

Add directly below it:

```ts
  constructionYear: z.string().nullable().optional(),
  saniert: z.string().nullable().optional(),
```

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/validations/offer.ts src/lib/validations/client.ts
git commit -m "feat: accept saniert in offer + client inquiry schemas"
```

---

### Task 4: Persistence — save `saniert` to Client

**Files:**
- Modify: `src/lib/actions/offers.ts` (two `tx.client.update` blocks)
- Modify: `src/lib/actions/clients.ts` (`inquiryFieldKeys` whitelist)

- [ ] **Step 1: `createOffer` persistence**

In `src/lib/actions/offers.ts`, inside `createOffer`'s `tx.client.update`, find:

```ts
        constructionYear: validated.inquiry.constructionYear ?? null,
```

(the FIRST occurrence, ~line 164). Add directly below it:

```ts
        constructionYear: validated.inquiry.constructionYear ?? null,
        saniert: validated.inquiry.saniert ?? null,
```

- [ ] **Step 2: `saveOfferDraft` persistence**

In the same file, inside `saveOfferDraft`'s `tx.client.update`, find the SECOND occurrence of:

```ts
        constructionYear: validated.inquiry.constructionYear ?? null,
```

(~line 228). Add directly below it:

```ts
        constructionYear: validated.inquiry.constructionYear ?? null,
        saniert: validated.inquiry.saniert ?? null,
```

- [ ] **Step 3: Editor whitelist**

In `src/lib/actions/clients.ts`, find the `inquiryFieldKeys` array and the line:

```ts
  "constructionYear",
```

Add directly below it:

```ts
  "constructionYear",
  "saniert",
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: no new errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/actions/offers.ts src/lib/actions/clients.ts
git commit -m "feat: persist saniert from offer wizard and inquiry editor"
```

---

### Task 5: Angebot wizard — chip field + wiring

**Files:**
- Modify: `src/components/offers/offer-wizard-dialog.tsx`
- Modify: `src/components/clients/client-detail-workspace.tsx`

- [ ] **Step 1: Import the new constants**

In `src/components/offers/offer-wizard-dialog.tsx`, the import block from `@/lib/heizlast` currently is:

```ts
  BAUJAHR_CHIPS,
  calcHeizlast,
  type BaujahrChip,
```

Replace with:

```ts
  BAUJAHR_CHIPS,
  SANIERT_CHIPS,
  calcHeizlast,
  type BaujahrChip,
  type SaniertChip,
```

- [ ] **Step 2: Extend the `ClientInquiry` interface**

Find:

```ts
  constructionYear: string | null;
```

(inside `interface ClientInquiry`). Add directly below it:

```ts
  constructionYear: string | null;
  saniert: string | null;
```

- [ ] **Step 3: Extend the form default values**

In `OfferWizardContent`'s `defaultValues.inquiry`, find:

```ts
        constructionYear: inquiry.constructionYear ?? "",
```

Add directly below it:

```ts
        constructionYear: inquiry.constructionYear ?? "",
        saniert: inquiry.saniert ?? "",
```

- [ ] **Step 4: Add the chip field in `INQUIRY_FIELDS`**

Find the `constructionYear` entry in the `INQUIRY_FIELDS` array:

```ts
  {
    key: "constructionYear",
    label: "Baujahr / Dämmstandard",
    placeholder: "z. B. 1985 / saniert",
    chips: [...BAUJAHR_CHIPS],
    section: "Gebäude",
  },
```

Add directly below it (so it renders right after Baujahr):

```ts
  {
    key: "saniert",
    label: "Saniert?",
    placeholder: "Auswahl…",
    chips: [...SANIERT_CHIPS],
    section: "Gebäude",
  },
```

- [ ] **Step 5: Pass `saniert` into the `HeizlastWidget` calc**

In `HeizlastWidget`, find:

```ts
  const baujahrRaw = inquiry?.constructionYear?.trim();
  const baujahr = (BAUJAHR_CHIPS as readonly string[]).includes(baujahrRaw ?? "")
    ? (baujahrRaw as BaujahrChip)
    : null;

  const result = calcHeizlast({
    wohnflaecheM2: wohn,
    baujahr,
    jahresverbrauchKwh: verbrauch,
    personen,
  });
```

Replace with:

```ts
  const baujahrRaw = inquiry?.constructionYear?.trim();
  const baujahr = (BAUJAHR_CHIPS as readonly string[]).includes(baujahrRaw ?? "")
    ? (baujahrRaw as BaujahrChip)
    : null;
  const saniertRaw = inquiry?.saniert?.trim();
  const saniert = (SANIERT_CHIPS as readonly string[]).includes(saniertRaw ?? "")
    ? (saniertRaw as SaniertChip)
    : null;

  const result = calcHeizlast({
    wohnflaecheM2: wohn,
    baujahr,
    saniert,
    jahresverbrauchKwh: verbrauch,
    personen,
  });
```

- [ ] **Step 6: Pass `saniert` into the `recommendedKw` calc (positions step)**

Find the `recommendedKw` useMemo block:

```ts
    const baujahr = (inq.constructionYear as BaujahrChip) || null;
    const valid = baujahr && BAUJAHR_CHIPS.includes(baujahr as BaujahrChip);
    const wohn = Number(inq.wohnflaecheM2) || 0;
    const verbrauch = Number(inq.annualKwhGas) || 0;
    const personen = Number(inq.householdSize) || 0;
    if (!wohn && !verbrauch) return null;
    const r = calcHeizlast({
      wohnflaecheM2: wohn,
      baujahr: valid ? (baujahr as BaujahrChip) : null,
      jahresverbrauchKwh: verbrauch,
      personen,
    });
```

Replace with:

```ts
    const baujahr = (inq.constructionYear as BaujahrChip) || null;
    const valid = baujahr && BAUJAHR_CHIPS.includes(baujahr as BaujahrChip);
    const saniert = (inq.saniert as SaniertChip) || null;
    const saniertValid = saniert && SANIERT_CHIPS.includes(saniert as SaniertChip);
    const wohn = Number(inq.wohnflaecheM2) || 0;
    const verbrauch = Number(inq.annualKwhGas) || 0;
    const personen = Number(inq.householdSize) || 0;
    if (!wohn && !verbrauch) return null;
    const r = calcHeizlast({
      wohnflaecheM2: wohn,
      baujahr: valid ? (baujahr as BaujahrChip) : null,
      saniert: saniertValid ? (saniert as SaniertChip) : null,
      jahresverbrauchKwh: verbrauch,
      personen,
    });
```

- [ ] **Step 7: Pass `saniert` from the client into the wizard**

In `src/components/clients/client-detail-workspace.tsx`, find in the `<OfferWizardDialog … inquiry={{ … }}>` object:

```tsx
          constructionYear: client.constructionYear,
```

Add directly below it:

```tsx
          constructionYear: client.constructionYear,
          saniert: client.saniert,
```

- [ ] **Step 8: Typecheck**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: no new errors.

- [ ] **Step 9: Commit**

```bash
git add src/components/offers/offer-wizard-dialog.tsx src/components/clients/client-detail-workspace.tsx
git commit -m "feat: Saniert chip field in Angebot wizard, wired into kW calc"
```

---

### Task 6: Mirror field in client inquiry editor

**Files:**
- Modify: `src/components/clients/inquiry-editor.tsx`

- [ ] **Step 1: Add the field to the editor list**

In `src/components/clients/inquiry-editor.tsx`, in the `INQUIRY_FIELDS` array, find:

```ts
  { key: "constructionYear", label: "Baujahr" },
```

Add directly below it:

```ts
  { key: "constructionYear", label: "Baujahr" },
  { key: "saniert", label: "Saniert?" },
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: no new errors (`saniert` is now a valid `keyof ClientDetail` after Task 2's `prisma generate`).

- [ ] **Step 3: Commit**

```bash
git add src/components/clients/inquiry-editor.tsx
git commit -m "feat: mirror Saniert field in client inquiry editor"
```

---

### Task 7: Final verification

- [ ] **Step 1: Re-run the unit test**

Run: `npx tsx src/lib/heizlast.test.ts`
Expected: `✓ heizlast saniert tests passed`.

- [ ] **Step 2: Full typecheck**

Run: `npx tsc --noEmit`
Expected: clean (no new errors vs. before this work).

- [ ] **Step 3: Lint the touched files**

Run: `npm run lint`
Expected: no new errors in the touched files.

- [ ] **Step 4: Production build**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 5 (manual, optional): Smoke test in the app**

Start dev (`npm run dev`), open a client → "Angebot erstellen", step "Anfrage":
- Confirm a "Saniert?" chip row appears right under "Baujahr / Dämmstandard".
- With Wohnfläche 150 + Baujahr `1978–1994`: Heizlast Gebäude ≈ 15,0 kW.
- Select "Ja, 50%" → ≈ 10,5 kW. Select "Ja" → ≈ 7,5 kW. Select "Nein" → back to 15,0 kW.
- Save the offer, reopen the wizard → "Saniert?" retains the selection.

---

## Self-Review Notes

- **Spec coverage:** behavior (Task 5), factors in calc (Task 1), area-only effect + consumption untouched (Task 1 test), `Client.saniert` column (Task 2), schemas (Task 3), default ×1.0 / backwards-compat (Task 1 null test + Task 5 `?? ""`), editor mirror (Task 6). All spec sections mapped.
- **Type consistency:** `SaniertChip`, `SANIERT_CHIPS`, `SANIERT_FACTOR`, `HeizlastInput.saniert`, `inquiry.saniert`, `Client.saniert` used consistently across tasks.
- **No placeholders:** every code step shows the actual code.
