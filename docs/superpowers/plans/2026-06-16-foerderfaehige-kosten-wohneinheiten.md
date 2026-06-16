# Förderfähige Kosten nach Wohneinheiten — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auto-fill the "Förderfähige Kosten" field in the Angebot KfW calculator from the entered Anzahl Wohneinheiten (BEG cap: 30k + 15k per unit 2–6 + 8k per unit 7+), while keeping the field editable.

**Architecture:** A pure helper `maxFoerderfaehigeKosten(we)` in `kfw-foerderung.ts` encodes the BEG tier formula. The `KfwCalculator` (offer wizard) reads `inquiry.wohneinheiten` via `useWatch`, computes the cap, and a `useEffect` keyed on the cap sets `foerderfaehigeKosten` — firing only when the unit count changes, so manual edits persist.

**Tech Stack:** Next.js 16, React 19, react-hook-form. No unit-test framework → the pure helper gets a dependency-free `tsx` + `node:assert` test; UI wiring verified via `tsc`/build.

**Spec:** `docs/superpowers/specs/2026-06-16-foerderfaehige-kosten-wohneinheiten-design.md`

---

### Task 1: Pure helper `maxFoerderfaehigeKosten`

**Files:**
- Modify: `src/lib/kfw-foerderung.ts`
- Test: `src/lib/kfw-foerderung.test.ts` (create)

- [ ] **Step 1: Write the failing test**

Create `src/lib/kfw-foerderung.test.ts`:

```ts
import assert from "node:assert/strict";
import { maxFoerderfaehigeKosten } from "./kfw-foerderung";

assert.equal(maxFoerderfaehigeKosten(1), 30000);
assert.equal(maxFoerderfaehigeKosten(2), 45000);
assert.equal(maxFoerderfaehigeKosten(3), 60000);
assert.equal(maxFoerderfaehigeKosten(6), 105000);
assert.equal(maxFoerderfaehigeKosten(7), 113000);
// invalid / empty → treat as 1 WE
assert.equal(maxFoerderfaehigeKosten(0), 30000);
assert.equal(maxFoerderfaehigeKosten(Number.NaN), 30000);
assert.equal(maxFoerderfaehigeKosten(-3), 30000);

console.log("✓ kfw maxFoerderfaehigeKosten tests passed");
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx tsx src/lib/kfw-foerderung.test.ts`
Expected: FAIL — `maxFoerderfaehigeKosten` is not exported (TypeScript error / not a function).

- [ ] **Step 3: Implement the helper**

In `src/lib/kfw-foerderung.ts`, append at the end of the file:

```ts
/**
 * Maximal förderfähige Kosten nach BEG/KfW-458 in Abhängigkeit von der Anzahl
 * Wohneinheiten: 30.000 € für die 1. WE, je 15.000 € für die 2.–6. WE und je
 * 8.000 € ab der 7. WE. Ungültige/leere Angaben werden wie 1 WE behandelt.
 */
export function maxFoerderfaehigeKosten(wohneinheiten: number): number {
  const we = Math.max(1, Math.floor(Number(wohneinheiten) || 1));
  const tier2to6 = Math.min(we - 1, 5);
  const tier7plus = Math.max(we - 6, 0);
  return 30000 + tier2to6 * 15000 + tier7plus * 8000;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx tsx src/lib/kfw-foerderung.test.ts`
Expected: `✓ kfw maxFoerderfaehigeKosten tests passed`, exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/lib/kfw-foerderung.ts src/lib/kfw-foerderung.test.ts
git commit -m "feat: maxFoerderfaehigeKosten helper for BEG Wohneinheiten cap"
```

---

### Task 2: Wire Wohneinheiten into the KfW calculator

**Files:**
- Modify: `src/components/offers/offer-wizard-dialog.tsx`

- [ ] **Step 1: Import the helper**

In the import block from `@/lib/kfw-foerderung`, currently:

```ts
import {
  DEFAULT_KFW_FOERDERUNG,
  KFW_BONI,
  KFW_MAX_PERCENT,
  calcKfw,
  type KfwFoerderung,
} from "@/lib/kfw-foerderung";
```

Replace with:

```ts
import {
  DEFAULT_KFW_FOERDERUNG,
  KFW_BONI,
  KFW_MAX_PERCENT,
  calcKfw,
  maxFoerderfaehigeKosten,
  type KfwFoerderung,
} from "@/lib/kfw-foerderung";
```

(`useEffect` and `useWatch` are already imported — no change needed.)

- [ ] **Step 2: Add `control` to `DiscountsStepProps`**

Find:

```ts
interface DiscountsStepProps {
  fields: ReturnType<typeof useFieldArray<CreateOfferData, "discounts">>["fields"];
  append: ReturnType<typeof useFieldArray<CreateOfferData, "discounts">>["append"];
  remove: ReturnType<typeof useFieldArray<CreateOfferData, "discounts">>["remove"];
  register: ReturnType<typeof useForm<CreateOfferData>>["register"];
  setValue: ReturnType<typeof useForm<CreateOfferData>>["setValue"];
  totals: ReturnType<typeof calcTotals>;
}
```

Replace with (add the `control` line):

```ts
interface DiscountsStepProps {
  fields: ReturnType<typeof useFieldArray<CreateOfferData, "discounts">>["fields"];
  append: ReturnType<typeof useFieldArray<CreateOfferData, "discounts">>["append"];
  remove: ReturnType<typeof useFieldArray<CreateOfferData, "discounts">>["remove"];
  register: ReturnType<typeof useForm<CreateOfferData>>["register"];
  setValue: ReturnType<typeof useForm<CreateOfferData>>["setValue"];
  control: ReturnType<typeof useForm<CreateOfferData>>["control"];
  totals: ReturnType<typeof calcTotals>;
}
```

- [ ] **Step 3: Pass `control` at the `DiscountsStep` render site**

Find (step === 2 block):

```tsx
          {step === 2 && (
            <DiscountsStep
              fields={discounts.fields}
              append={discounts.append}
              remove={discounts.remove}
              register={register}
              setValue={setValue}
              totals={totals}
            />
          )}
```

Replace with (add `control={control}`):

```tsx
          {step === 2 && (
            <DiscountsStep
              fields={discounts.fields}
              append={discounts.append}
              remove={discounts.remove}
              register={register}
              setValue={setValue}
              control={control}
              totals={totals}
            />
          )}
```

- [ ] **Step 4: Accept `control` in `DiscountsStep` and pass it to `KfwCalculator`**

Find:

```ts
function DiscountsStep({ fields, append, remove, register, setValue, totals }: DiscountsStepProps) {
```

Replace with:

```ts
function DiscountsStep({ fields, append, remove, register, setValue, control, totals }: DiscountsStepProps) {
```

Then find:

```tsx
      <KfwCalculator setValue={setValue} />
```

Replace with:

```tsx
      <KfwCalculator setValue={setValue} control={control} />
```

- [ ] **Step 5: Update `KfwCalculator` to read Wohneinheiten and auto-fill the cap**

Find:

```ts
function KfwCalculator({
  setValue,
}: {
  setValue: ReturnType<typeof useForm<CreateOfferData>>["setValue"];
}) {
  const [kfw, setKfw] = useState<KfwFoerderung>(DEFAULT_KFW_FOERDERUNG);
  const result = calcKfw(kfw);

  function update<K extends keyof KfwFoerderung>(key: K, value: KfwFoerderung[K]) {
    const next = { ...kfw, [key]: value };
    setKfw(next);
    setValue("kfwFoerderung", next, { shouldDirty: true });
  }
```

Replace with:

```ts
function KfwCalculator({
  setValue,
  control,
}: {
  setValue: ReturnType<typeof useForm<CreateOfferData>>["setValue"];
  control: ReturnType<typeof useForm<CreateOfferData>>["control"];
}) {
  const [kfw, setKfw] = useState<KfwFoerderung>(DEFAULT_KFW_FOERDERUNG);
  const result = calcKfw(kfw);

  const wohneinheiten = useWatch({ control, name: "inquiry.wohneinheiten" }) as
    | string
    | null
    | undefined;
  const cap = maxFoerderfaehigeKosten(Number(wohneinheiten) || 1);

  function update<K extends keyof KfwFoerderung>(key: K, value: KfwFoerderung[K]) {
    const next = { ...kfw, [key]: value };
    setKfw(next);
    setValue("kfwFoerderung", next, { shouldDirty: true });
  }

  // Auto-fill the förderfähige Kosten cap from the number of Wohneinheiten.
  // Keyed on `cap` so it only fires when the unit count changes — manual edits
  // to the field (which don't change `cap`) are preserved.
  useEffect(() => {
    update("foerderfaehigeKosten", cap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cap]);
```

- [ ] **Step 6: Update the helper text under the field**

Find:

```tsx
            <p className="text-xs text-muted-foreground">
              KfW deckelt die förderfähigen Kosten typisch bei 30.000 € pro
              Wohneinheit.
            </p>
```

Replace with:

```tsx
            <p className="text-xs text-muted-foreground">
              Automatisch aus der Anzahl Wohneinheiten: 30.000 € (1. WE)
              + 15.000 € je weitere (2.–6.) + 8.000 € ab der 7. WE. Editierbar.
            </p>
```

- [ ] **Step 7: Typecheck**

Run: `npx tsc --noEmit 2>&1 | tail -30`
Expected: no NEW errors in `offer-wizard-dialog.tsx` or `kfw-foerderung.ts`. (Pre-existing unrelated warnings/errors elsewhere — e.g. a known `react-hooks/preserve-manual-memoization` — may remain; ignore those.)

- [ ] **Step 8: Commit**

```bash
git add src/components/offers/offer-wizard-dialog.tsx
git commit -m "feat: auto-fill Förderfähige Kosten from Anzahl Wohneinheiten"
```

---

### Task 3: Final verification

- [ ] **Step 1: Run both unit tests**

Run: `npx tsx src/lib/kfw-foerderung.test.ts && npx tsx src/lib/heizlast.test.ts`
Expected: both print their `✓ … passed` lines.

- [ ] **Step 2: Full typecheck**

Run: `npx tsc --noEmit`
Expected: clean (no new errors vs. before this work).

- [ ] **Step 3: Lint the touched files**

Run: `npx eslint src/lib/kfw-foerderung.ts src/components/offers/offer-wizard-dialog.tsx`
Expected: no NEW errors introduced by this work. (The pre-existing `react-hooks/preserve-manual-memoization` + `kind unused` in `offer-wizard-dialog.tsx` predate this change. The new `useEffect` carries an intentional `eslint-disable-next-line react-hooks/exhaustive-deps`.)

- [ ] **Step 4: Production build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, exit 0.

- [ ] **Step 5 (manual, optional): Smoke test**

In the running dev app (`http://localhost:3100`), open a client → "Angebot erstellen" → step "Anfrage": set **Anzahl Wohneinheiten = 2** → go to the "Förderung/Rabatte" step: the **Förderfähige Kosten** field shows **45.000 €** and the Förderung amount recalculates. Change Wohneinheiten to 1 → field returns to 30.000 €. Manually editing the field and NOT changing Wohneinheiten keeps the manual value.

---

## Self-Review Notes

- **Spec coverage:** helper + formula (Task 1), import (T2.1), control plumbing through DiscountsStep (T2.2–2.4), useWatch + cap + auto-fill effect editable behavior (T2.5), helper text (T2.6), tests (Task 1 + Task 3). No percent-logic/schema/PDF changes (out of scope, untouched). All spec sections mapped.
- **Type consistency:** `maxFoerderfaehigeKosten(number): number`, `control` typed as `useForm<CreateOfferData>["control"]` everywhere, `cap` consumed by `update("foerderfaehigeKosten", cap)`. Consistent across tasks.
- **No placeholders:** every code step shows the actual code.
