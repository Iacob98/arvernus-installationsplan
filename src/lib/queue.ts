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
  from?: string;
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

// Offer-Versand (asynchron, damit die UI nicht auf den SMTP-Roundtrip wartet)
export type OfferSendJobData = {
  type: "offer-send";
  emailLogId: string;
  offerId: string;
  clientId: string;
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
  attachments: {
    filename: string;
    content: string; // base64
    encoding: "base64";
    cid?: string;
  }[];
};

export async function addOfferSendJob(data: OfferSendJobData) {
  return emailQueue.add("send-offer", data, { priority: 1 });
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

// Offer reminder (delayed)
export type OfferReminderJobData = {
  type: "offer-reminder";
  reminderId: string;
};

export async function scheduleOfferReminderJob(
  reminderId: string,
  jobId: string,
  delayMs: number,
) {
  return emailQueue.add(
    "send-offer-reminder",
    { type: "offer-reminder", reminderId } satisfies OfferReminderJobData,
    { delay: delayMs, jobId, priority: 3 },
  );
}

export async function removeOfferReminderJob(jobId: string) {
  const job = await emailQueue.getJob(jobId);
  if (job) await job.remove();
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

// OBI Partnercenter lead import
export type ObiImportJobData = {
  triggeredAt: string;
  /** Manual trigger from the UI vs. the scheduled poll. */
  manual?: boolean;
};

export const obiQueue = new Queue("obi-import", {
  connection: redis,
  defaultJobOptions: {
    // Scraping is heavy; don't auto-retry a failed run (the scheduler retries soon).
    attempts: 1,
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 20 },
  },
});

export async function addObiImportJob(data: Partial<ObiImportJobData> = {}) {
  return obiQueue.add("import-obi", {
    triggeredAt: new Date().toISOString(),
    ...data,
  });
}
