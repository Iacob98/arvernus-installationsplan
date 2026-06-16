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

// saniert ALSO scales the consumption method (21000/2100*0.9 = 9.0 base)
const consBase = calcHeizlast({ jahresverbrauchKwh: 21000 });
assert.equal(consBase.heizlastByConsumption, 9);
const consNein = calcHeizlast({ jahresverbrauchKwh: 21000, saniert: "Nein" });
assert.equal(consNein.heizlastByConsumption, 9);
const consTeil = calcHeizlast({ jahresverbrauchKwh: 21000, saniert: "Ja, 50%" });
assert.equal(consTeil.heizlastByConsumption, 6.3);
const consVoll = calcHeizlast({ jahresverbrauchKwh: 21000, saniert: "Ja" });
assert.equal(consVoll.heizlastByConsumption, 4.5);

// with consumption present, saniert now DOES change the headline kW and WP size
const headNein = calcHeizlast({
  wohnflaecheM2: 150,
  baujahr: "1978–1994",
  jahresverbrauchKwh: 21000,
  saniert: "Nein",
});
const headVoll = calcHeizlast({
  wohnflaecheM2: 150,
  baujahr: "1978–1994",
  jahresverbrauchKwh: 21000,
  saniert: "Ja",
});
assert.equal(headNein.heizlastKw, 9);
assert.equal(headVoll.heizlastKw, 4.5);
assert.notEqual(headNein.empfohleneWpKw, headVoll.empfohleneWpKw);

console.log("✓ heizlast saniert tests passed");
