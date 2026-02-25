import { Worker, Job } from "bullmq";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { db } from "@/lib/db";
import { redis, ImapJobData } from "@/lib/queue";

interface ParsedContact {
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

function parseContactForm(text: string): ParsedContact | null {
  // [:=\t] — support colon, equals, and tab separators (HTML table → text uses tabs)
  const nameMatch = text.match(/(?:Name|Vorname.*?Nachname)\s*[:=\t]\s*(.+)/i);
  const emailMatch = text.match(/(?:E-?Mail|Email)\s*[:=\t]\s*(\S+@\S+)/i);
  const phoneMatch = text.match(/(?:Telefon|Tel|Phone)\s*[:=\t]\s*([+\d\s()-]+)/i);
  const addressMatch = text.match(/(?:Adresse|Address|Straße)\s*[:=\t]\s*(.+)/i);
  const messageMatch = text.match(/(?:Nachricht|Message|Anmerkung|Kommentar)\s*[:=\t]\s*([\s\S]*?)(?:\n\s*\n|$)/i);
  const plzMatch = text.match(/(?:PLZ|Postleitzahl)\s*[:=\t]\s*(\d{4,5})/i);
  const cityMatch = text.match(/(?:Stadt|Ort|City)\s*[:=\t]\s*(.+)/i);
  const anredeMatch = text.match(/Anrede\s*[:=\t]\s*(.+)/i);

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
        const textBody = parsed.text || "";
        const contact = parseContactForm(textBody);

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
              status: "IN_BEARBEITUNG",
              substatus: "IN_KONTAKT",
              source: "website",
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
