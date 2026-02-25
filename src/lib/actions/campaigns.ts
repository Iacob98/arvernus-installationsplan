"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { addCampaignEmailJob } from "@/lib/queue";
import { getFileUrl, deleteFile } from "@/lib/storage";
import { campaignCreateSchema, CampaignCreateFormData } from "@/lib/validations/campaign";
import { revalidatePath } from "next/cache";
import { ClientStatus } from "@prisma/client";

export async function getTemplates() {
  const session = await auth();
  if (!session?.user) throw new Error("Nicht authentifiziert");

  return db.emailTemplate.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { images: true } },
    },
  });
}

export async function getTemplate(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Nicht authentifiziert");

  const template = await db.emailTemplate.findUnique({
    where: { id },
    include: { images: true },
  });

  if (!template) throw new Error("Vorlage nicht gefunden");

  // Generate presigned URLs for images
  const imagesWithUrls = await Promise.all(
    template.images.map(async (img) => ({
      ...img,
      url: await getFileUrl(img.storagePath),
    }))
  );

  return { ...template, images: imagesWithUrls };
}

export async function deleteTemplate(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Nicht authentifiziert");

  const template = await db.emailTemplate.findUnique({
    where: { id },
    include: { images: true },
  });

  if (!template) throw new Error("Vorlage nicht gefunden");

  // Delete linked campaigns and their email logs first
  const campaigns = await db.campaign.findMany({ where: { templateId: id }, select: { id: true } });
  if (campaigns.length > 0) {
    const campaignIds = campaigns.map((c) => c.id);
    await db.emailLog.deleteMany({ where: { campaignId: { in: campaignIds } } });
    await db.campaign.deleteMany({ where: { templateId: id } });
  }

  // Delete images from storage
  for (const img of template.images) {
    try {
      await deleteFile(img.storagePath);
    } catch {
      // Ignore storage errors during cleanup
    }
  }

  await db.emailTemplate.delete({ where: { id } });

  revalidatePath("/campaigns");
}

export async function getCampaigns() {
  const session = await auth();
  if (!session?.user) throw new Error("Nicht authentifiziert");

  return db.campaign.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      template: { select: { name: true, subject: true } },
      createdBy: { select: { name: true } },
    },
  });
}

export async function getCampaign(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Nicht authentifiziert");

  const campaign = await db.campaign.findUnique({
    where: { id },
    include: {
      template: { select: { name: true, subject: true } },
      createdBy: { select: { name: true } },
    },
  });

  if (!campaign) throw new Error("Kampagne nicht gefunden");
  return campaign;
}

export async function getRecipientCount(statusFilter?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Nicht authentifiziert");

  const where: Record<string, unknown> = { email: { not: "" }, unsubscribed: false };
  if (statusFilter && statusFilter !== "ALL") {
    where.status = statusFilter as ClientStatus;
  }

  return db.client.count({ where });
}

export async function createCampaign(data: CampaignCreateFormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Nicht authentifiziert");

  const validated = campaignCreateSchema.parse(data);

  // Fetch template with images
  const template = await db.emailTemplate.findUnique({
    where: { id: validated.templateId },
    include: { images: true },
  });
  if (!template) throw new Error("Vorlage nicht gefunden");

  // Fetch recipients
  const clientWhere: Record<string, unknown> = { email: { not: "" }, unsubscribed: false };
  if (validated.statusFilter && validated.statusFilter !== "ALL") {
    clientWhere.status = validated.statusFilter as ClientStatus;
  }

  const clients = await db.client.findMany({
    where: clientWhere,
    select: { id: true, email: true },
  });

  const clientsWithEmail = clients.filter((c) => c.email);
  if (clientsWithEmail.length === 0) {
    throw new Error("Keine Kunden mit E-Mail-Adresse gefunden");
  }

  // Create campaign
  const campaign = await db.campaign.create({
    data: {
      name: validated.name,
      status: "SENDING",
      recipientCount: clientsWithEmail.length,
      templateId: template.id,
      createdById: session.user.id,
    },
  });

  // Batch create email logs
  const emailLogData = clientsWithEmail.map((client) => ({
    subject: template.subject,
    body: "",
    recipients: [client.email!],
    clientId: client.id,
    sentById: session.user!.id!,
    campaignId: campaign.id,
  }));

  const emailLogs = await db.emailLog.createManyAndReturn({
    data: emailLogData,
  });

  // Enqueue individual jobs
  const imageData = template.images.map((img) => ({
    filename: img.filename,
    storagePath: img.storagePath,
    cid: img.cid,
    mimeType: img.mimeType,
  }));

  for (const emailLog of emailLogs) {
    await addCampaignEmailJob({
      type: "campaign",
      emailLogId: emailLog.id,
      campaignId: campaign.id,
      to: emailLog.recipients,
      subject: template.subject,
      htmlContent: template.htmlCid,
      images: imageData,
    });
  }

  revalidatePath("/campaigns");
  return campaign;
}
