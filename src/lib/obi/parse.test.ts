import assert from "node:assert/strict";
import { parseObiName, parseObiAddress, parseObiDetailText, assembleLead } from "./parse";

// --- parseObiName ---
assert.deepEqual(parseObiName("Frau Almoustafa, Majd"), {
  salutation: "Frau",
  lastName: "Almoustafa",
  firstName: "Majd",
});
assert.deepEqual(parseObiName("Herr Eßer-Holtappels, Hans Peter"), {
  salutation: "Herr",
  lastName: "Eßer-Holtappels",
  firstName: "Hans Peter",
});
assert.deepEqual(parseObiName("Schmidt, Hans"), {
  salutation: null,
  lastName: "Schmidt",
  firstName: "Hans",
});
assert.deepEqual(parseObiName("Mustermann"), {
  salutation: null,
  lastName: "Mustermann",
  firstName: "",
});

// --- parseObiAddress ---
assert.deepEqual(parseObiAddress("Lange Straße 33, 58636 Iserlohn"), {
  street: "Lange Straße",
  houseNumber: "33",
  postalCode: "58636",
  city: "Iserlohn",
});
assert.deepEqual(parseObiAddress("Hauptstr. 1a, 10115 Berlin"), {
  street: "Hauptstr.",
  houseNumber: "1a",
  postalCode: "10115",
  city: "Berlin",
});
// unparseable → whole thing as street, rest empty (still lets a client be created)
assert.equal(parseObiAddress("Irgendwo").postalCode, "");

// --- parseObiDetailText (real captured layout) ---
const detail = `Projekte
Almoustafa, Majd
Neues Projekt
Seit Gestern
Aktualisieren
Projektinformationen
Dokumente
Projektverlauf
Kundendaten

Kunde

Frau Almoustafa, Majd

Telefonnummer

15780997381

E-Mail

majdswery6@gmail.com

Adresse

Lange Straße 33, 58636 Iserlohn

Baustellenadresse

(identisch)

Termine

Beratungstermin

-

Anfragedetails

Wärmepumpe beraten, verkaufen und installieren`;

const parsed = parseObiDetailText(detail);
assert.equal(parsed.name, "Frau Almoustafa, Majd");
assert.equal(parsed.phone, "15780997381");
assert.equal(parsed.email, "majdswery6@gmail.com");
assert.equal(parsed.address, "Lange Straße 33, 58636 Iserlohn");
assert.equal(parsed.anfrage, "Wärmepumpe beraten, verkaufen und installieren");

// --- assembleLead end-to-end ---
const lead = assembleLead(
  { externalId: "DE096126L31435_2", rawName: "Almoustafa, Majd", phone: "015780997381", status: "Neues Projekt", ageText: "Seit Gestern" },
  detail,
);
assert.equal(lead.externalId, "DE096126L31435_2");
assert.equal(lead.salutation, "Frau");
assert.equal(lead.firstName, "Majd");
assert.equal(lead.lastName, "Almoustafa");
assert.equal(lead.email, "majdswery6@gmail.com");
assert.equal(lead.street, "Lange Straße");
assert.equal(lead.houseNumber, "33");
assert.equal(lead.postalCode, "58636");
assert.equal(lead.city, "Iserlohn");
assert.equal(lead.status, "Neues Projekt");

console.log("✓ obi/parse tests passed");
