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
