import "dotenv/config";
import { startEmailWorker } from "./worker";
import { startImapWorker } from "./imap-worker";
import { imapQueue } from "@/lib/queue";

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

async function shutdown() {
  console.log("Shutting down email workers...");
  await Promise.all([emailWorker.close(), imapWorker.close()]);
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
