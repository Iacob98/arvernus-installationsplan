import { Worker, Job } from "bullmq";
import { render } from "@react-email/render";
import { db } from "@/lib/db";
import { redis, EmailJobData, CampaignEmailJobData } from "@/lib/queue";
import { smtpTransporter } from "./smtp";
import { getLogoBase64 } from "@/lib/pdf/logo";
import { getFileBuffer } from "@/lib/storage";
import { BrandedEmail } from "./template";

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

    await smtpTransporter.sendMail({
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

async function processEmailJob(job: Job<EmailJobData | CampaignEmailJobData>) {
  if ("type" in job.data && job.data.type === "campaign") {
    return processCampaignEmailJob(job as Job<CampaignEmailJobData>);
  }

  const { emailLogId, to, subject, body } = job.data as EmailJobData;

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

    await smtpTransporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
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

  worker.on("failed", (job, err) => {
    console.error(`Email job ${job?.id} failed:`, err.message);
  });

  return worker;
}
