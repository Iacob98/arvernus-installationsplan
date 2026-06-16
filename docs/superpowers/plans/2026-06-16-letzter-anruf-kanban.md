# Letzter Anruf auf Kanban-Karten — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the last-call date+time on each Kanban client card (`/clients`) and sort each status column by last call — never-called on top, then oldest→newest.

**Architecture:** A pure, testable comparator `compareByLastCall` lives in `src/lib/client-sort.ts`. The Kanban board imports it to sort each column in its `grouped` useMemo, and renders an absolute "Letzter Anruf" line in its internal `ClientCard`. Desktop columns and mobile tabs both go through the same exported `Column`/`ClientCard`, so one set of edits covers both. No query/schema/DB change — `KanbanClient.lastCall` already exists.

**Tech Stack:** Next.js 16, React 19, date-fns. No unit-test framework → the pure comparator gets a dependency-free `tsx` + `node:assert` test; UI verified via `tsc`/build.

**Spec:** `docs/superpowers/specs/2026-06-16-letzter-anruf-kanban-design.md`

---

### Task 1: Pure comparator `compareByLastCall`

**Files:**
- Create: `src/lib/client-sort.ts`
- Test: `src/lib/client-sort.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/lib/client-sort.test.ts`:

```ts
import assert from "node:assert/strict";
import { compareByLastCall } from "./client-sort";

const old = new Date("2026-01-01T10:00:00Z");
const recent = new Date("2026-06-10T10:00:00Z");

// never-called (null) sorts before a dated entry
assert.ok(compareByLastCall({ lastCall: null }, { lastCall: old }) < 0);
assert.ok(compareByLastCall({ lastCall: old }, { lastCall: null }) > 0);

// two dated: older before newer
assert.ok(compareByLastCall({ lastCall: old }, { lastCall: recent }) < 0);
assert.ok(compareByLastCall({ lastCall: recent }, { lastCall: old }) > 0);

// both null → 0
assert.equal(compareByLastCall({ lastCall: null }, { lastCall: null }), 0);

// full array sort: [recent, null, old] → [null, old, recent]
const arr = [{ lastCall: recent }, { lastCall: null }, { lastCall: old }];
const sorted = [...arr].sort(compareByLastCall);
assert.deepEqual(
  sorted.map((x) => x.lastCall),
  [null, old, recent],
);

console.log("✓ client-sort compareByLastCall tests passed");
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx tsx src/lib/client-sort.test.ts`
Expected: FAIL — `compareByLastCall` is not exported / module not found.

- [ ] **Step 3: Implement the comparator**

Create `src/lib/client-sort.ts`:

```ts
/**
 * Sortiert Kunden nach letztem Anruf: noch nie angerufen (null) zuerst,
 * danach aufsteigend nach Anrufdatum (älteste zuerst). Für Array.sort.
 */
export function compareByLastCall(
  a: { lastCall: Date | null },
  b: { lastCall: Date | null },
): number {
  if (a.lastCall === null && b.lastCall === null) return 0;
  if (a.lastCall === null) return -1;
  if (b.lastCall === null) return 1;
  return a.lastCall.getTime() - b.lastCall.getTime();
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx tsx src/lib/client-sort.test.ts`
Expected: `✓ client-sort compareByLastCall tests passed`, exit 0.

- [ ] **Step 5: Commit**

```bash
git add src/lib/client-sort.ts src/lib/client-sort.test.ts
git commit -m "feat: compareByLastCall comparator for client sorting"
```

---

### Task 2: Wire into the Kanban board (sort + display)

**Files:**
- Modify: `src/components/clients/clients-kanban-board.tsx`

- [ ] **Step 1: Add the `format` import from date-fns**

Find:

```ts
import { formatDistanceToNowStrict, startOfDay } from "date-fns";
```

Replace with:

```ts
import { format, formatDistanceToNowStrict, startOfDay } from "date-fns";
```

- [ ] **Step 2: Import the comparator**

Directly below the `import { MobileStatusTabs } from "./mobile-status-tabs";` line, add:

```ts
import { compareByLastCall } from "@/lib/client-sort";
```

- [ ] **Step 3: Sort each column in the `grouped` useMemo**

Find:

```ts
  const grouped = useMemo(() => {
    const g: Record<ClientStatus, KanbanClient[]> = {
      NEU: [],
      ANGERUFEN: [],
      ANGEBOT_VERSENDET: [],
      IM_KONTAKT: [],
      VERKAUFT: [],
      NICHT_VERKAUFT: [],
    };
    for (const c of clients) g[c.status]?.push(c);
    return g;
  }, [clients]);
```

Replace with:

```ts
  const grouped = useMemo(() => {
    const g: Record<ClientStatus, KanbanClient[]> = {
      NEU: [],
      ANGERUFEN: [],
      ANGEBOT_VERSENDET: [],
      IM_KONTAKT: [],
      VERKAUFT: [],
      NICHT_VERKAUFT: [],
    };
    for (const c of clients) g[c.status]?.push(c);
    for (const status of STATUS_ORDER) g[status].sort(compareByLastCall);
    return g;
  }, [clients]);
```

- [ ] **Step 4: Add the "Letzter Anruf" line in the internal `ClientCard`**

Find the activity-counts row inside `ClientCard`:

```tsx
        <div className="flex items-center gap-3 font-mono text-[10px] tabular-nums">
          <ActivityCount icon={Phone} count={client.callsCount} title="Anrufe" />
          <ActivityCount icon={FileText} count={client.offersCount} title="Angebote" />
          <ActivityCount icon={Mail} count={client.emailsCount} title="E-Mails" />
          <span className="ml-auto text-muted-foreground/60">
            {formatRel(client.updatedAt)}
          </span>
        </div>
```

Insert DIRECTLY BELOW that closing `</div>` a new line:

```tsx
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/80">
          <Phone className="h-2.5 w-2.5 shrink-0" />
          <span className="truncate">
            {client.lastCall
              ? `Letzter Anruf: ${format(client.lastCall, "dd.MM.yyyy HH:mm")}`
              : "Noch nie angerufen"}
          </span>
        </div>
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit 2>&1 | tail -20`
Expected: no NEW errors in `clients-kanban-board.tsx` or `client-sort.ts`. (Pre-existing unrelated warnings elsewhere may remain.)

- [ ] **Step 6: Commit**

```bash
git add src/components/clients/clients-kanban-board.tsx
git commit -m "feat: show last call + sort Kanban columns by call recency"
```

---

### Task 3: Final verification

- [ ] **Step 1: Run the unit test**

Run: `npx tsx src/lib/client-sort.test.ts`
Expected: `✓ client-sort compareByLastCall tests passed`.

- [ ] **Step 2: Full typecheck**

Run: `npx tsc --noEmit`
Expected: clean (no new errors vs. before this work).

- [ ] **Step 3: Lint the touched files**

Run: `npx eslint src/lib/client-sort.ts src/components/clients/clients-kanban-board.tsx`
Expected: no NEW errors introduced by this work.

- [ ] **Step 4: Production build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, exit 0.

- [ ] **Step 5 (manual, optional): Smoke test**

In the dev app (`http://localhost:3100`), open `/clients`: each card shows
`Letzter Anruf: dd.MM.yyyy HH:mm` (or `Noch nie angerufen`). Within a status
column, never-called cards are at the top, then oldest→newest by call date. The
mobile status-tabs view (narrow window) shows the same order and line.

---

## Self-Review Notes

- **Spec coverage:** comparator + formula (Task 1), display line (T2.4), per-column sort covering desktop+mobile (T2.3), `format` import (T2.1), tests (Task 1 + Task 3). No query/schema/DB or other-surface changes (out of scope, untouched). All spec sections mapped.
- **Type consistency:** `compareByLastCall(a: { lastCall: Date | null }, b: …): number` used identically in test, module, and the board's `.sort(compareByLastCall)`. `KanbanClient.lastCall` is `Date | null`, matching the comparator and `format(client.lastCall, …)` (guarded by the `client.lastCall ?` check). `STATUS_ORDER` is the existing exported `ClientStatus[]`.
- **No placeholders:** every code step shows the actual code.
