import assert from "node:assert/strict";
import { compareByLastCall, compareByInboxThenCall } from "./client-sort";

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

// compareByInboxThenCall: unread inbound always sorts before read clients,
// regardless of call recency.
const base = { unreadInboundCount: 0, lastInboundAt: null as Date | null };
const unread = { ...base, unreadInboundCount: 1 };

// unread (even never-called) before a read client with an old call
assert.ok(
  compareByInboxThenCall(
    { ...unread, lastCall: null },
    { ...base, lastCall: old },
  ) < 0,
);
// read client never overtakes an unread one even with a "better" call position
assert.ok(
  compareByInboxThenCall(
    { ...base, lastCall: null },
    { ...unread, lastCall: recent },
  ) > 0,
);

// two unread: newest inbound first
assert.ok(
  compareByInboxThenCall(
    { ...unread, lastInboundAt: recent, lastCall: null },
    { ...unread, lastInboundAt: old, lastCall: null },
  ) < 0,
);

// neither unread → falls back to compareByLastCall (older call first)
assert.ok(
  compareByInboxThenCall(
    { ...base, lastCall: old },
    { ...base, lastCall: recent },
  ) < 0,
);

// full column sort: unread-recent, read-old, unread-old, read-null
// → [unread-recent, unread-old, read-null, read-old]
const col = [
  { ...unread, lastInboundAt: recent, lastCall: recent, k: "u-recent" },
  { ...base, lastCall: old, k: "r-old" },
  { ...unread, lastInboundAt: old, lastCall: null, k: "u-old" },
  { ...base, lastCall: null, k: "r-null" },
];
assert.deepEqual(
  [...col].sort(compareByInboxThenCall).map((x) => x.k),
  ["u-recent", "u-old", "r-null", "r-old"],
);

console.log("✓ client-sort compareByInboxThenCall tests passed");
