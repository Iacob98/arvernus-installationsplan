import assert from "node:assert/strict";
import {
  canonicalPhone,
  normalizeEmail,
  buildClientIndex,
  matchLead,
  OBI_SOURCE,
  type ClientDedupRow,
} from "./dedup";

// --- canonicalPhone: all variants of the same DE number collapse ---
assert.equal(canonicalPhone("15780997381"), "15780997381");
assert.equal(canonicalPhone("015780997381"), "15780997381");
assert.equal(canonicalPhone("+49 157 8099 7381"), "15780997381");
assert.equal(canonicalPhone("0049 157/80997381"), "15780997381");
assert.equal(canonicalPhone(""), "");
assert.equal(canonicalPhone(null), "");

// --- normalizeEmail ---
assert.equal(normalizeEmail("  Foo@Bar.DE "), "foo@bar.de");

const rows: ClientDedupRow[] = [
  // already-imported OBI lead
  { id: "c1", email: "a@x.de", phone: "017611112222", lastName: "Meier", postalCode: "10115", externalId: "DE1_1", source: OBI_SOURCE },
  // legacy client (manual entry, no externalId) — matchable only by fuzzy keys
  { id: "c2", email: "legacy@x.de", phone: "0157 80997381", lastName: "Almoustafa", postalCode: "58636", externalId: null, source: "website" },
];
const idx = buildClientIndex(rows);

// 1. externalId exact (fast path) — future re-import is skipped
assert.deepEqual(matchLead(idx, { externalId: "DE1_1", email: "new@x.de" }), {
  clientId: "c1",
  reason: "externalId",
});

// 2. email match on a legacy client (different externalId)
assert.deepEqual(matchLead(idx, { externalId: "DE9_9", email: "LEGACY@x.de" }), {
  clientId: "c2",
  reason: "email",
});

// 3. phone match across formatting differences
assert.deepEqual(
  matchLead(idx, { externalId: "DE9_9", email: "other@x.de", phone: "+4915780997381" }),
  { clientId: "c2", reason: "phone" },
);

// 4. name + PLZ match when email/phone differ
assert.deepEqual(
  matchLead(idx, { externalId: "DE9_9", lastName: "almoustafa", postalCode: "58636" }),
  { clientId: "c2", reason: "name+plz" },
);

// name match requires BOTH lastName and PLZ
assert.equal(matchLead(idx, { lastName: "Almoustafa" }), null);
assert.equal(matchLead(idx, { postalCode: "58636" }), null);

// genuinely new lead → no match → will be created
assert.equal(
  matchLead(idx, { externalId: "DE7_7", email: "brand@new.de", phone: "030999", lastName: "Neu", postalCode: "99999" }),
  null,
);

// re-import idempotency: a created lead's externalId now blocks the next run
const after = buildClientIndex([
  ...rows,
  { id: "c3", email: "brand@new.de", phone: "030999", lastName: "Neu", postalCode: "99999", externalId: "DE7_7", source: OBI_SOURCE },
]);
assert.deepEqual(matchLead(after, { externalId: "DE7_7", email: "brand@new.de" }), {
  clientId: "c3",
  reason: "externalId",
});

console.log("✓ obi/dedup tests passed");
