import "dotenv/config";
import { startPdfWorker } from "./worker";

console.log("Starting PDF worker...");
const worker = startPdfWorker();

process.on("SIGTERM", async () => {
  console.log("Shutting down PDF worker...");
  await worker.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("Shutting down PDF worker...");
  await worker.close();
  process.exit(0);
});
