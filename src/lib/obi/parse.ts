import type { ObiListItem, ObiLead } from "./types";

/**
 * Parse an OBI display name: optional "Herr "/"Frau " salutation prefix,
 * followed by "Nachname, Vorname".
 *   "Frau Almoustafa, Majd" → { salutation: "Frau", lastName: "Almoustafa", firstName: "Majd" }
 *   "Schmidt, Hans-Peter"    → { salutation: null, lastName: "Schmidt", firstName: "Hans-Peter" }
 *   "Mustermann"             → { salutation: null, lastName: "Mustermann", firstName: "" }
 */
export function parseObiName(raw: string): {
  salutation: string | null;
  firstName: string;
  lastName: string;
} {
  let rest = (raw || "").trim();
  let salutation: string | null = null;
  const lower = rest.toLowerCase();
  if (lower.startsWith("herr ")) {
    salutation = "Herr";
    rest = rest.slice(5).trim();
  } else if (lower.startsWith("frau ")) {
    salutation = "Frau";
    rest = rest.slice(5).trim();
  }

  const comma = rest.indexOf(",");
  if (comma >= 0) {
    return {
      salutation,
      lastName: rest.slice(0, comma).trim(),
      firstName: rest.slice(comma + 1).trim(),
    };
  }
  // No comma: best-effort — treat the whole thing as the last name.
  return { salutation, lastName: rest, firstName: "" };
}

/**
 * Parse a combined German address line as shown on the OBI detail page.
 *   "Lange Straße 33, 58636 Iserlohn"
 *     → { street: "Lange Straße", houseNumber: "33", postalCode: "58636", city: "Iserlohn" }
 * Mirrors the IMAP worker's parseFullAddress so imported addresses look the same.
 */
export function parseObiAddress(address: string): {
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
} {
  const line = (address || "").replace(/\s+/g, " ").trim();
  const combined = line.match(/^(.+?)\s+(\d+\s*\w?)\s*,\s*(\d{4,5})\s+(.+)$/);
  if (combined) {
    return {
      street: combined[1].trim(),
      houseNumber: combined[2].replace(/\s+/g, "").trim(),
      postalCode: combined[3],
      city: combined[4].trim(),
    };
  }
  const simple = line.match(/^(.+?)\s+(\d+\s*\w?)$/);
  if (simple) {
    return { street: simple[1].trim(), houseNumber: simple[2].replace(/\s+/g, "").trim(), postalCode: "", city: "" };
  }
  return { street: line, houseNumber: "", postalCode: "", city: "" };
}

/** Known labels on the detail page; a value is the next non-empty line after a label. */
const DETAIL_LABELS = [
  "Kunde",
  "Telefonnummer",
  "E-Mail",
  "Adresse",
  "Baustellenadresse",
  "Termine",
  "Beratungstermin",
  "Rückmeldung erwartet",
  "Baustellenzeitraum",
  "Projektvolumen",
  "Angebotswert",
  "Notizen",
  "Projekt Notiz",
  "Anfragedetails",
];

function valueAfter(lines: string[], label: string): string {
  const idx = lines.findIndex((l) => l === label);
  if (idx < 0) return "";
  const next = lines[idx + 1];
  if (!next) return "";
  // Don't return another label or placeholder dashes as a value.
  if (DETAIL_LABELS.includes(next)) return "";
  if (next === "-" || next === "(identisch)") return "";
  return next;
}

/**
 * Extract the raw labelled fields from the detail page's innerText.
 * Robust to layout: matches on label lines and takes the following line.
 */
export function parseObiDetailText(text: string): {
  name: string;
  phone: string;
  email: string;
  address: string;
  anfrage: string;
} {
  const lines = (text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  return {
    name: valueAfter(lines, "Kunde"),
    phone: valueAfter(lines, "Telefonnummer"),
    email: valueAfter(lines, "E-Mail"),
    address: valueAfter(lines, "Adresse"),
    anfrage: valueAfter(lines, "Anfragedetails"),
  };
}

/**
 * Combine list-grid info with a detail page's innerText into a full ObiLead.
 * Detail values win; the list item supplies externalId/status and fallbacks.
 */
export function assembleLead(item: ObiListItem, detailText: string): ObiLead {
  const d = parseObiDetailText(detailText);
  const name = parseObiName(d.name || item.rawName);
  const addr = parseObiAddress(d.address);
  return {
    externalId: item.externalId,
    salutation: name.salutation,
    firstName: name.firstName,
    lastName: name.lastName,
    email: d.email.trim(),
    phone: (d.phone || item.phone).trim(),
    street: addr.street,
    houseNumber: addr.houseNumber,
    postalCode: addr.postalCode,
    city: addr.city,
    anfrage: d.anfrage.trim(),
    status: item.status,
  };
}
