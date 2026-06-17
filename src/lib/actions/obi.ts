"use server";

import { requireAdmin } from "@/lib/auth-utils";
import { addObiImportJob, obiQueue } from "@/lib/queue";

/** Enqueue a manual OBI lead import (admin only). */
export async function triggerObiImport() {
  await requireAdmin();
  const job = await addObiImportJob({ manual: true });
  return { jobId: job.id ?? null };
}

export interface ObiImportStatus {
  running: boolean;
  last: {
    finishedAt: number | null;
    created: number;
    skippedDuplicates: number;
    errors: number;
    total: number;
    truncated: boolean;
  } | null;
}

/** Current import state + summary of the most recent completed run (admin only). */
export async function getObiImportStatus(): Promise<ObiImportStatus> {
  await requireAdmin();
  const [active, waiting, completed] = await Promise.all([
    obiQueue.getActiveCount(),
    obiQueue.getWaitingCount(),
    obiQueue.getJobs(["completed"], 0, 9),
  ]);

  const last = completed
    .filter((j) => j?.finishedOn)
    .sort((a, b) => (b.finishedOn ?? 0) - (a.finishedOn ?? 0))[0];
  const r = last?.returnvalue as
    | { created?: number; skippedDuplicates?: number; errors?: number; total?: number; truncated?: boolean }
    | undefined;

  return {
    running: active > 0 || waiting > 0,
    last: last
      ? {
          finishedAt: last.finishedOn ?? null,
          created: r?.created ?? 0,
          skippedDuplicates: r?.skippedDuplicates ?? 0,
          errors: r?.errors ?? 0,
          total: r?.total ?? 0,
          truncated: r?.truncated ?? false,
        }
      : null,
  };
}
