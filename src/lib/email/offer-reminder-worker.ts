import { Job } from "bullmq";
import { db } from "@/lib/db";
import type { OfferReminderJobData } from "@/lib/queue";
import { smtpTransporter } from "./smtp";
import { getLogoBase64 } from "@/lib/pdf/logo";
import { getFileBuffer } from "@/lib/storage";
import { renderBrandedHtmlEmail } from "./template";
import { replaceTemplateVars } from "@/lib/template-vars";

async function markSkipped(reminderId: string, reason: string) {
  await db.offerReminder.update({
    where: { id: reminderId },
    data: { status: "SKIPPED", skippedReason: reason },
  });
  return { skipped: true, reason };
}

export async function processOfferReminderJob(
  job: Job<OfferReminderJobData>,
) {
  const { reminderId } = job.data;

  const reminder = await db.offerReminder.findUnique({
    where: { id: reminderId },
    include: {
      offer: {
        include: {
          client: true,
          createdBy: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!reminder) return { skipped: true, reason: "reminder-deleted" };
  if (reminder.status !== "SCHEDULED") {
    return { skipped: true, reason: `status=${reminder.status}` };
  }

  const offer = reminder.offer;
  if (!offer) return markSkipped(reminderId, "offer-deleted");

  const client = offer.client;
  if (!client) return markSkipped(reminderId, "client-deleted");
  if (!client.email) return markSkipped(reminderId, "no-email");
  if (client.unsubscribed) return markSkipped(reminderId, "unsubscribed");
  if (
    client.status === "IM_KONTAKT" ||
    client.status === "VERKAUFT" ||
    client.status === "NICHT_VERKAUFT"
  ) {
    return markSkipped(reminderId, `client.status=${client.status}`);
  }
  if (
    offer.status === "ACCEPTED" ||
    offer.status === "REJECTED" ||
    offer.status === "EXPIRED"
  ) {
    return markSkipped(reminderId, `offer.status=${offer.status}`);
  }
  if (!offer.pdfStoragePath) return markSkipped(reminderId, "no-pdf");

  let pdfBuffer: Buffer;
  try {
    pdfBuffer = await getFileBuffer(offer.pdfStoragePath);
  } catch (e) {
    console.warn(
      `[OfferReminder] PDF not found: ${offer.pdfStoragePath}`,
      e,
    );
    return markSkipped(reminderId, "pdf-missing");
  }

  const template = await db.offerReminderTemplate.findUnique({
    where: { step: reminder.step },
  });
  if (!template) return markSkipped(reminderId, "no-template");

  const vars = {
    firstName: client.firstName,
    managerName: offer.createdBy?.name ?? "",
  };
  const subject = replaceTemplateVars(template.subject, vars);
  const htmlBody = replaceTemplateVars(template.htmlBody, vars);

  const company = (await db.companySettings.findFirst()) ?? {
    name: "Arvernus",
    street: "",
    postalCode: "",
    city: "",
    phone: null,
    email: null,
    website: null,
    primaryColor: "#1565C0",
  };

  const finalHtml = await renderBrandedHtmlEmail({
    subject,
    htmlBody,
    company: {
      name: company.name,
      street: company.street,
      postalCode: company.postalCode,
      city: company.city,
      phone: company.phone,
      email: company.email,
      website: company.website,
      primaryColor: company.primaryColor,
    },
  });

  const logoDataUri = getLogoBase64();
  const logoBuffer = Buffer.from(
    logoDataUri.replace(/^data:image\/\w+;base64,/, ""),
    "base64",
  );

  const emailLog = await db.emailLog.create({
    data: {
      subject,
      body: htmlBody,
      recipients: [client.email],
      clientId: client.id,
      sentById: offer.createdById,
      status: "PENDING",
    },
  });

  try {
    await smtpTransporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: client.email,
      subject,
      html: finalHtml,
      attachments: [
        { filename: "logo.png", content: logoBuffer, cid: "logo" },
        {
          filename:
            offer.pdfFileName ?? `${offer.offerNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    await db.$transaction([
      db.emailLog.update({
        where: { id: emailLog.id },
        data: { status: "SENT" },
      }),
      db.offerReminder.update({
        where: { id: reminderId },
        data: {
          status: "SENT",
          sentAt: new Date(),
          emailLogId: emailLog.id,
        },
      }),
    ]);

    return { success: true };
  } catch (err) {
    await db.emailLog.update({
      where: { id: emailLog.id },
      data: { status: "FAILED" },
    });
    throw err;
  }
}
