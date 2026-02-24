import { Queue, Worker, Job } from "bullmq";
import IORedis from "ioredis";

const globalForRedis = globalThis as unknown as {
  redis: IORedis | undefined;
};

export const redis =
  globalForRedis.redis ??
  new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
    maxRetriesPerRequest: null,
  });

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis;

export const pdfQueue = new Queue("pdf-generation", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

export type PdfJobData = {
  projectId: string;
  documentId: string;
  userId: string;
};

export async function addPdfJob(data: PdfJobData) {
  return pdfQueue.add("generate-pdf", data, {
    priority: 1,
  });
}
