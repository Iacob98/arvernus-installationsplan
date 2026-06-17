import { Worker, type Job } from "bullmq";
import { redis, type ObiImportJobData } from "@/lib/queue";
import { importObiLeads } from "./import";

async function processObiJob(job: Job<ObiImportJobData>) {
  // Cap detail-page opens per run so a single job stays bounded; the scheduler
  // picks up the rest on the next tick. 0 / unset = no cap (import everything).
  const maxDetails = Number(process.env.OBI_MAX_DETAILS_PER_RUN) || 0;
  console.log(`[obi] job ${job.id} starting (manual=${job.data.manual ?? false}, maxDetails=${maxDetails || "∞"})`);
  return importObiLeads({
    maxDetails,
    log: (m) => console.log(`[obi] ${m}`),
  });
}

export function startObiWorker() {
  const worker = new Worker("obi-import", processObiJob, {
    connection: redis,
    concurrency: 1, // one scraper session at a time
  });

  worker.on("completed", (job, result) => {
    console.log(
      `[obi] job ${job.id} completed: created=${result?.created ?? 0} ` +
        `skipped=${result?.skippedDuplicates ?? 0} errors=${result?.errors ?? 0}` +
        (result?.truncated ? " (truncated — more leads remain for next run)" : ""),
    );
  });

  worker.on("failed", (job, err) => {
    console.error(`[obi] job ${job?.id} failed:`, err.message);
  });

  return worker;
}
