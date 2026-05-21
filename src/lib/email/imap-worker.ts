import { Worker, Job } from "bullmq";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { db } from "@/lib/db";
import { redis, ImapJobData } from "@/lib/queue";

interface InquiryFields {
  ownership?: string;
  buildingType?: string;
  constructionYear?: string;
  householdSize?: string;
  currentHeating?: string;
  currentFuel?: string;
  heatingAge?: string;
  hotWaterIncluded?: string;
  timeframe?: string;
  availability?: string;
  annualKwhGas?: string;
  annualLitersOil?: string;
  additionalInfo?: string;
}

interface ParsedContact extends InquiryFields {
  salutation?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  city?: string;
  message?: string;
}

// Maps lowercased German labels → Client column names
const INQUIRY_FIELD_MAP: Record<string, keyof InquiryFields> = {
  "eigentumsverhältnis": "ownership",
  "eigentümer": "ownership",
  "gebäudetyp": "buildingType",
  "baujahr": "constructionYear",
  "personenanzahl im haushalt": "householdSize",
  "personenanzahl": "householdSize",
  "aktuelle heizung": "currentHeating",
  "genutzter brennstoff": "currentFuel",
  "brennstoff": "currentFuel",
  "alter der heizung": "heatingAge",
  "heizungsalter": "heatingAge",
  "wärmepumpe mit wassererwärmung": "hotWaterIncluded",
  "wärmepumpe mit wassererwärmung?": "hotWaterIncluded",
  "warmwasser": "hotWaterIncluded",
  "zeitrahmen": "timeframe",
  "erreichbarkeit": "availability",
  "jahresverbrauch in kwh (gas)": "annualKwhGas",
  "jahresverbrauch in kwh": "annualKwhGas",
  "jahresverbrauch in liter (heizöl)": "annualLitersOil",
  "jahresverbrauch in liter": "annualLitersOil",
  "zusätzliche projektinformationen": "additionalInfo",
};

// Parse HTML table: extract key-value pairs from <td>label</td><td>value</td>
function parseHtmlTable(html: string): Record<string, string> {
  const fields: Record<string, string> = {};
  const rowRegex = /<tr[^>]*>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi;
  let match;
  while ((match = rowRegex.exec(html)) !== null) {
    const key = match[1].replace(/<[^>]*>/g, "").trim();
    const value = match[2].replace(/<[^>]*>/g, "").trim();
    if (key && value) fields[key.toLowerCase()] = value;
  }
  return fields;
}

// Extract salutation from name if embedded (e.g. "herr Max Mustermann")
function extractSalutationFromName(name: string): { salutation?: string; cleanName: string } {
  const lower = name.trim().toLowerCase();
  if (lower.startsWith("herr ")) return { salutation: "Herr", cleanName: name.trim().slice(5) };
  if (lower.startsWith("frau ")) return { salutation: "Frau", cleanName: name.trim().slice(5) };
  return { cleanName: name.trim() };
}

// Parse combined address: "Straße Nr, PLZ Stadt"
function parseFullAddress(address: string): { street: string; houseNumber: string; postalCode: string; city: string } {
  // Try "street houseNumber, postalCode city"
  const combined = address.match(/^(.+?)\s+(\d+\s*\w?)\s*,\s*(\d{4,5})\s+(.+)$/);
  if (combined) {
    return { street: combined[1], houseNumber: combined[2], postalCode: combined[3], city: combined[4] };
  }
  // Try "street houseNumber" without PLZ/city
  const simple = address.match(/^(.+?)\s+(\d+\s*\w?)$/);
  if (simple) {
    return { street: simple[1], houseNumber: simple[2], postalCode: "", city: "" };
  }
  return { street: address, houseNumber: "", postalCode: "", city: "" };
}

// Contact/address keys that should not leak into the free-text notes
const CONTACT_KEYS = new Set([
  "name", "anrede", "e-mail", "email", "telefon", "tel", "phone",
  "adresse", "straße", "plz", "postleitzahl", "stadt", "ort", "city",
  "nachricht", "message", "anmerkung", "kommentar",
]);

function extractInquiryFields(fields: Record<string, string>): InquiryFields {
  const result: InquiryFields = {};
  for (const [key, target] of Object.entries(INQUIRY_FIELD_MAP)) {
    const value = fields[key];
    if (value) result[target] = value;
  }
  return result;
}

function parseContactFromFields(fields: Record<string, string>, isRechner: boolean): ParsedContact | null {
  const rawName = fields["name"];
  if (!rawName) return null;

  // Handle salutation: separate "anrede" field or embedded in name
  let salutation: string | undefined;
  let cleanName: string;

  if (fields["anrede"]) {
    const raw = fields["anrede"].toLowerCase();
    salutation = raw === "herr" ? "Herr" : raw === "frau" ? "Frau" : undefined;
    cleanName = rawName.trim();
  } else {
    const extracted = extractSalutationFromName(rawName);
    salutation = extracted.salutation;
    cleanName = extracted.cleanName;
  }

  const nameParts = cleanName.split(/\s+/);
  const firstName = nameParts[0] || "Unbekannt";
  const lastName = nameParts.slice(1).join(" ") || "Unbekannt";

  // Parse address
  let street = "-";
  let houseNumber = "-";
  let postalCode = fields["plz"] || fields["postleitzahl"] || "";
  let city = fields["stadt"] || fields["ort"] || fields["city"] || "";

  const rawAddress = fields["adresse"] || fields["straße"] || "";
  if (rawAddress) {
    const addr = parseFullAddress(rawAddress);
    street = addr.street || "-";
    houseNumber = addr.houseNumber || "-";
    if (addr.postalCode) postalCode = addr.postalCode;
    if (addr.city) city = addr.city;
  }

  // Structured inquiry fields → Client columns
  const inquiry = extractInquiryFields(fields);

  // Build notes from user message + any unrecognised extra fields
  const parts: string[] = [];
  const userMessage = fields["nachricht"] || fields["message"] || fields["anmerkung"] || fields["kommentar"];
  if (userMessage) parts.push(userMessage);

  if (isRechner) {
    const handled = new Set<string>([...Object.keys(INQUIRY_FIELD_MAP), ...CONTACT_KEYS]);
    const extraLines: string[] = [];
    for (const [key, value] of Object.entries(fields)) {
      if (handled.has(key)) continue;
      if (!value) continue;
      extraLines.push(`${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}`);
    }
    if (extraLines.length > 0) {
      parts.push("--- Weitere Angaben ---\n" + extraLines.join("\n"));
    }
  }

  return {
    salutation,
    firstName,
    lastName,
    email: fields["e-mail"] || fields["email"],
    phone: fields["telefon"] || fields["tel"] || fields["phone"],
    street,
    houseNumber,
    postalCode: postalCode || "00000",
    city: city || "-",
    message: parts.join("\n\n") || undefined,
    ...inquiry,
  };
}

function parseContactForm(text: string, html?: string, isRechner = false): ParsedContact | null {
  // Try HTML table parsing first (most reliable for form emails)
  if (html) {
    const fields = parseHtmlTable(html);
    if (Object.keys(fields).length > 0) {
      const result = parseContactFromFields(fields, isRechner);
      if (result) return result;
    }
  }

  // Fallback: parse plain text with flexible separators (colon, equals, tab, or 2+ spaces)
  const sep = "(?:[:\\t=]|\\s{2,})";
  const nameMatch = text.match(new RegExp("(?:Name|Vorname.*?Nachname)\\s*" + sep + "\\s*(.+)", "i"));
  const emailMatch = text.match(new RegExp("(?:E-?Mail|Email)\\s*" + sep + "\\s*(\\S+@\\S+)", "i"));
  const phoneMatch = text.match(new RegExp("(?:Telefon|Tel|Phone)\\s*" + sep + "\\s*([+\\d\\s()-]+)", "i"));
  const addressMatch = text.match(new RegExp("(?:Adresse|Address|Straße)\\s*" + sep + "\\s*(.+)", "i"));
  const messageMatch = text.match(new RegExp("(?:Nachricht|Message|Anmerkung|Kommentar)\\s*" + sep + "\\s*([\\s\\S]*?)(?:\\n\\s*\\n|$)", "i"));
  const plzMatch = text.match(new RegExp("(?:PLZ|Postleitzahl)\\s*" + sep + "\\s*(\\d{4,5})", "i"));
  const cityMatch = text.match(new RegExp("(?:Stadt|Ort|City)\\s*" + sep + "\\s*(.+)", "i"));
  const anredeMatch = text.match(new RegExp("Anrede\\s*" + sep + "\\s*(.+)", "i"));

  if (!nameMatch) return null;

  const fullName = nameMatch[1].trim();
  const nameParts = fullName.split(/\s+/);
  const firstName = nameParts[0] || "Unbekannt";
  const lastName = nameParts.slice(1).join(" ") || "Unbekannt";

  let street = "";
  let houseNumber = "";
  if (addressMatch) {
    const addrParts = addressMatch[1].trim().match(/^(.+?)\s+(\d+\s*\w?)$/);
    if (addrParts) {
      street = addrParts[1];
      houseNumber = addrParts[2];
    } else {
      street = addressMatch[1].trim();
    }
  }

  const rawAnrede = anredeMatch?.[1]?.trim().toLowerCase();
  const salutation = rawAnrede === "herr" ? "Herr" : rawAnrede === "frau" ? "Frau" : undefined;

  return {
    salutation,
    firstName,
    lastName,
    email: emailMatch?.[1]?.trim(),
    phone: phoneMatch?.[1]?.trim(),
    street: street || "-",
    houseNumber: houseNumber || "-",
    postalCode: plzMatch?.[1]?.trim() || "00000",
    city: cityMatch?.[1]?.trim() || "-",
    message: messageMatch?.[1]?.trim(),
  };
}

async function processImapJob(job: Job<ImapJobData>) {
  const host = process.env.IMAP_HOST;
  const port = Number(process.env.IMAP_PORT) || 993;
  const user = process.env.IMAP_USER;
  const pass = process.env.IMAP_PASS;
  const folder = process.env.IMAP_FOLDER || "INBOX";

  if (!host || !user || !pass) {
    console.log("IMAP not configured, skipping import");
    return { success: true, imported: 0 };
  }

  const client = new ImapFlow({
    host,
    port,
    secure: port === 993,
    auth: { user, pass },
    logger: false,
    socketTimeout: 30000,
  });

  // Prevent unhandled 'error' events from crashing the process
  client.on("error", (err: Error) => {
    console.error("IMAP connection error:", err.message);
  });

  let imported = 0;

  try {
    await client.connect();
    const lock = await client.getMailboxLock(folder);

    try {
      const messages = client.fetch("1:*", {
        envelope: true,
        source: true,
        uid: true,
      });

      for await (const msg of messages) {
        const messageId = msg.envelope?.messageId;
        if (!messageId) continue;

        // Check idempotency
        const existing = await db.imapProcessedEmail.findUnique({
          where: { messageId },
        });
        if (existing) continue;

        if (!msg.source) continue;
        const parsed = await simpleParser(msg.source);
        const subject = parsed.subject || "";

        // Skip Partneranfragen — not a client
        if (/partneranfrage/i.test(subject)) {
          await db.imapProcessedEmail.create({
            data: {
              messageId,
              subject,
              fromAddress: parsed.from?.value?.[0]?.address || null,
            },
          });
          continue;
        }

        // Detect email type
        const isRechner = /rechner/i.test(subject);
        const isContactForm = isRechner || /kontaktanfrage/i.test(subject);

        if (!isContactForm) {
          // Unknown email type — record but skip
          await db.imapProcessedEmail.create({
            data: {
              messageId,
              subject,
              fromAddress: parsed.from?.value?.[0]?.address || null,
            },
          });
          continue;
        }

        const textBody = parsed.text || "";
        const htmlBody = parsed.html || undefined;
        const contact = parseContactForm(textBody, htmlBody, isRechner);

        let clientId: string | undefined;

        if (contact) {
          const customerNumber = `WEB-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

          const newClient = await db.client.create({
            data: {
              customerNumber,
              salutation: contact.salutation || null,
              firstName: contact.firstName,
              lastName: contact.lastName,
              email: contact.email || "",
              phone: contact.phone || "",
              street: contact.street || "-",
              houseNumber: contact.houseNumber || "-",
              postalCode: contact.postalCode || "00000",
              city: contact.city || "-",
              notes: contact.message || "",
              status: "NEU",
              substatus: "IN_KONTAKT",
              source: "website",
              ownership: contact.ownership || null,
              buildingType: contact.buildingType || null,
              constructionYear: contact.constructionYear || null,
              householdSize: contact.householdSize || null,
              currentHeating: contact.currentHeating || null,
              currentFuel: contact.currentFuel || null,
              heatingAge: contact.heatingAge || null,
              hotWaterIncluded: contact.hotWaterIncluded || null,
              timeframe: contact.timeframe || null,
              availability: contact.availability || null,
              annualKwhGas: contact.annualKwhGas || null,
              annualLitersOil: contact.annualLitersOil || null,
              additionalInfo: contact.additionalInfo || null,
            },
          });

          clientId = newClient.id;
          imported++;
        }

        await db.imapProcessedEmail.create({
          data: {
            messageId,
            subject: parsed.subject || null,
            fromAddress: parsed.from?.value?.[0]?.address || null,
            clientId,
          },
        });

        // Move to Processed folder
        try {
          await client.messageMove(msg.uid.toString(), "Processed", { uid: true });
        } catch {
          // Processed folder may not exist, skip moving
        }
      }
    } finally {
      lock.release();
    }

    await client.logout();
  } catch (error) {
    console.error("IMAP import error:", error);
    try { await client.close(); } catch {}
    throw error;
  }

  return { success: true, imported };
}

export function startImapWorker() {
  const worker = new Worker("imap-import", processImapJob, {
    connection: redis,
    concurrency: 1,
  });

  worker.on("completed", (job, result) => {
    console.log(`IMAP job ${job.id} completed, imported: ${result?.imported ?? 0}`);
  });

  worker.on("failed", (job, err) => {
    console.error(`IMAP job ${job?.id} failed:`, err.message);
  });

  return worker;
}
