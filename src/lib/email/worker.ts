import { Worker, Job } from "bullmq";
import { render } from "@react-email/render";
import { db } from "@/lib/db";
import {
  redis,
  EmailJobData,
  CampaignEmailJobData,
  OfferReminderJobData,
  OfferSendJobData,
} from "@/lib/queue";
import { sendMailWithRetry } from "./smtp";
import { getLogoBase64 } from "@/lib/pdf/logo";
import { getFileBuffer } from "@/lib/storage";
import { BrandedEmail } from "./template";
import { processOfferReminderJob } from "./offer-reminder-worker";
import { cancelOfferReminders } from "@/lib/actions/offer-reminders";

/**
 * Versendet ein Angebot asynchron. Die UI hat bereits optimistisch SENT
 * gesetzt; hier wird nur tatsächlich gemailt. Erst nach endgültigem
 * Fehlschlag (alle Versuche) wird zurückgerollt, damit ein einmaliger
 * Mailserver-Aussetzer nicht sofort das Angebot auf FAILED kippt.
 */
async function processOfferSendJob(job: Job<OfferSendJobData>) {
  const { emailLogId, offerId, from, to, subject, text, html, attachments } =
    job.data;
  try {
    await sendMailWithRetry({
      from,
      to,
      subject,
      text,
      html,
      attachments: attachments.map((a) => ({
        filename: a.filename,
        content: a.content,
        encoding: a.encoding,
        ...(a.cid ? { cid: a.cid } : {}),
      })),
    });

    await db.emailLog.update({
      where: { id: emailLogId },
      data: { status: "SENT" },
    });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Offer-send job ${job.id} failed:`, message);

    const attempts = job.opts.attempts ?? 3;
    if (job.attemptsMade >= attempts) {
      // endgültig fehlgeschlagen → optimistisches SENT zurücknehmen
      await db.emailLog
        .update({ where: { id: emailLogId }, data: { status: "FAILED" } })
        .catch(() => {});
      await db.offer
        .update({
          where: { id: offerId },
          data: { status: "DRAFT", sentAt: null },
        })
        .catch(() => {});
      await cancelOfferReminders(offerId).catch(() => {});
    }
    throw error;
  }
}

async function processCampaignEmailJob(
  job: Job<CampaignEmailJobData>
) {
  const { emailLogId, campaignId, to, subject, htmlContent, images } = job.data;

  try {
    const attachments = await Promise.all(
      images.map(async (img) => ({
        filename: img.filename,
        content: await getFileBuffer(img.storagePath),
        cid: img.cid,
        contentType: img.mimeType,
      }))
    );

    // Append unsubscribe footer to campaign emails
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const unsubscribeUrl = `${appUrl}/unsubscribe`;

    const finalHtml = htmlContent + `<div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;font-size:12px;color:#6b7280">
  <a href="${unsubscribeUrl}" style="color:#6b7280;text-decoration:underline">Abmelden</a>
</div>`;

    const headers: Record<string, string> = {
      "List-Unsubscribe": `<${unsubscribeUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    };

    await sendMailWithRetry({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: to.join(", "),
      subject,
      html: finalHtml,
      attachments,
      headers,
    });

    await db.emailLog.update({
      where: { id: emailLogId },
      data: { status: "SENT" },
    });

    await db.campaign.update({
      where: { id: campaignId },
      data: { sentCount: { increment: 1 } },
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Campaign email job ${job.id} failed:`, message);

    await db.emailLog.update({
      where: { id: emailLogId },
      data: { status: "FAILED" },
    });

    await db.campaign.update({
      where: { id: campaignId },
      data: { failedCount: { increment: 1 } },
    });

    throw error;
  }
}

type AnyEmailJobData =
  | EmailJobData
  | CampaignEmailJobData
  | OfferReminderJobData
  | OfferSendJobData;

async function processEmailJob(job: Job<AnyEmailJobData>) {
  if ("type" in job.data && job.data.type === "campaign") {
    return processCampaignEmailJob(job as Job<CampaignEmailJobData>);
  }
  if ("type" in job.data && job.data.type === "offer-reminder") {
    return processOfferReminderJob(job as Job<OfferReminderJobData>);
  }
  if ("type" in job.data && job.data.type === "offer-send") {
    return processOfferSendJob(job as Job<OfferSendJobData>);
  }

  const { emailLogId, to, subject, body, from } = job.data as EmailJobData;

  try {
    const company = await db.companySettings.findFirst();

    let html: string;
    let logoBuffer: Buffer | undefined;

    if (company) {
      const logoDataUri = getLogoBase64();
      const base64Data = logoDataUri.replace(/^data:image\/\w+;base64,/, "");
      logoBuffer = Buffer.from(base64Data, "base64");

      html = await render(
        BrandedEmail({
          subject,
          body,
          company: {
            name: company.name,
            street: `${company.street}`,
            postalCode: company.postalCode,
            city: company.city,
            phone: company.phone,
            email: company.email,
            website: company.website,
            primaryColor: company.primaryColor,
          },
        })
      );
    } else {
      html = body.replace(/\n/g, "<br>");
    }

    await sendMailWithRetry({
      from: from || process.env.SMTP_FROM || process.env.SMTP_USER,
      to: to.join(", "),
      subject,
      text: body,
      html,
      ...(logoBuffer
        ? {
            attachments: [
              {
                filename: "logo.png",
                content: logoBuffer,
                cid: "logo",
              },
            ],
          }
        : {}),
    });

    await db.emailLog.update({
      where: { id: emailLogId },
      data: { status: "SENT" },
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`Email job ${job.id} failed:`, message);

    await db.emailLog.update({
      where: { id: emailLogId },
      data: { status: "FAILED" },
    });

    throw error;
  }
}

export function startEmailWorker() {
  const worker = new Worker("email-sending", processEmailJob, {
    connection: redis,
    concurrency: 2,
    limiter: {
      max: 30,
      duration: 60000,
    },
  });

  worker.on("completed", (job) => {
    console.log(`Email job ${job.id} completed`);
  });

  worker.on("failed", async (job, err) => {
    console.error(`Email job ${job?.id} failed:`, err.message);
    if (!job) return;
    const data = job.data as AnyEmailJobData | undefined;
    if (data && "type" in data && data.type === "offer-reminder") {
      const attempts = job.opts.attempts ?? 3;
      if (job.attemptsMade >= attempts) {
        await db.offerReminder
          .update({
            where: { id: data.reminderId },
            data: { status: "FAILED", skippedReason: err.message },
          })
          .catch(() => {});
      }
    }
  });

  return worker;
}
