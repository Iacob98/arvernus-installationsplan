import { Queue } from "bullmq";
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

// Email queue
export type EmailJobData = {
  emailLogId: string;
  to: string[];
  subject: string;
  body: string;
};

export const emailQueue = new Queue("email-sending", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

export async function addEmailJob(data: EmailJobData) {
  return emailQueue.add("send-email", data, {
    priority: 1,
  });
}

// Campaign email queue
export type CampaignEmailJobData = {
  type: "campaign";
  emailLogId: string;
  campaignId: string;
  to: string[];
  subject: string;
  htmlContent: string;
  images: Array<{
    filename: string;
    storagePath: string;
    cid: string;
    mimeType: string;
  }>;
};

export async function addCampaignEmailJob(data: CampaignEmailJobData) {
  return emailQueue.add("send-campaign-email", data, {
    priority: 2,
  });
}

// IMAP queue
export type ImapJobData = {
  triggeredAt: string;
};

export const imapQueue = new Queue("imap-import", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 10000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 20 },
  },
});

export async function addImapJob() {
  return imapQueue.add("import-emails", {
    triggeredAt: new Date().toISOString(),
  });
}
