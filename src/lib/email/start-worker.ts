import "dotenv/config";
import { startEmailWorker } from "./worker";
import { startImapWorker } from "./imap-worker";
import { startSmtpKeepWarm } from "./smtp";
import { startObiWorker } from "@/lib/obi/worker";
import { imapQueue, obiQueue } from "@/lib/queue";

// SMTP-Verbindung warm halten, damit der Mailserver nicht bei jedem Versand
// seine ~20 s Anti-Spam-Verzögerung für "kalte" Verbindungen verhängt.
startSmtpKeepWarm();

console.log("Starting email worker...");
const emailWorker = startEmailWorker();

console.log("Starting IMAP worker...");
const imapWorker = startImapWorker();

// Schedule recurring IMAP import
const intervalMinutes = Number(process.env.IMAP_POLL_INTERVAL_MINUTES) || 5;
imapQueue.upsertJobScheduler(
  "imap-poll",
  { every: intervalMinutes * 60 * 1000 },
  {
    name: "import-emails",
    data: { triggeredAt: new Date().toISOString() },
  }
);
console.log(`IMAP poll scheduled every ${intervalMinutes} minutes`);

// OBI Partnercenter lead import (only if configured)
let obiWorker: ReturnType<typeof startObiWorker> | null = null;
if (process.env.OBI_USER && process.env.OBI_PASS && process.env.OBI_PROJECT_ID) {
  console.log("Starting OBI import worker...");
  obiWorker = startObiWorker();
  const obiMinutes = Number(process.env.OBI_POLL_INTERVAL_MINUTES) || 60;
  obiQueue.upsertJobScheduler(
    "obi-poll",
    { every: obiMinutes * 60 * 1000 },
    {
      name: "import-obi",
      data: { triggeredAt: new Date().toISOString() },
    },
  );
  console.log(`OBI poll scheduled every ${obiMinutes} minutes`);
} else {
  console.log("OBI import disabled (OBI_USER/OBI_PASS/OBI_PROJECT_ID not set)");
}

async function shutdown() {
  console.log("Shutting down email workers...");
  await Promise.all([emailWorker.close(), imapWorker.close(), obiWorker?.close()].filter(Boolean) as Promise<void>[]);
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
