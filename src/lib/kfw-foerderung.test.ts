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
