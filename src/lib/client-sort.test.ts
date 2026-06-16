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
