"use server";

import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import {
  createOfferSchema,
  draftOfferSchema,
  sendOfferSchema,
  CreateOfferData,
  SendOfferData,
} from "@/lib/validations/offer";
import { renderOfferPdf, calculateTotals } from "@/lib/pdf/offer-renderer";
import { uploadFile, deleteFile, getFileBuffer } from "@/lib/storage";
import { smtpTransporter } from "@/lib/email/smtp";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { render } from "@react-email/render";
import { BrandedEmail } from "@/lib/email/template";
import { getLogoBase64 } from "@/lib/pdf/logo";
import { DEFAULT_COMPANY } from "@/lib/pdf/shared";

const offerListInclude = {
  createdBy: { select: { name: true } },
  _count: { select: { positions: true } },
} satisfies Prisma.OfferInclude;

export type OfferListItem = Prisma.OfferGetPayload<{
  include: typeof offerListInclude;
}>;

const offerDetailInclude = {
  client: true,
  createdBy: { select: { id: true, name: true, email: true } },
  positions: { orderBy: { order: "asc" as const } },
  discounts: { orderBy: { order: "asc" as const } },
} satisfies Prisma.OfferInclude;

export type OfferDetail = Prisma.OfferGetPayload<{
  include: typeof offerDetailInclude;
}>;

export type OfferDetailForClient = Omit<OfferDetail, "positions" | "discounts"> & {
  positions: (Omit<OfferDetail["positions"][number], "unitPrice"> & {
    unitPrice: number;
  })[];
  discounts: (Omit<OfferDetail["discounts"][number], "value"> & {
    value: number;
  })[];
};

export async function listOffersForClient(clientId: string): Promise<OfferListItem[]> {
  await requireAuth();
  return db.offer.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: offerListInclude,
  });
}

export async function getOffer(id: string): Promise<OfferDetail | null> {
  await requireAuth();
  return db.offer.findUnique({
    where: { id },
    include: offerDetailInclude,
  });
}

async function generateOfferNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `A-${year}-`;
  const last = await db.offer.findFirst({
    where: { offerNumber: { startsWith: prefix } },
    orderBy: { offerNumber: "desc" },
    select: { offerNumber: true },
  });
  let next = 1;
  if (last) {
    const num = parseInt(last.offerNumber.slice(prefix.length), 10);
    if (!isNaN(num)) next = num + 1;
  }
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export async function createOffer(clientId: string, data: CreateOfferData) {
  const session = await requireAuth();
  const validated = createOfferSchema.parse(data);

  const client = await db.client.findUnique({ where: { id: clientId } });
  if (!client) throw new Error("Kunde nicht gefunden");

  const offerNumber = await generateOfferNumber();

  const offer = await db.$transaction(async (tx) => {
    await tx.client.update({
      where: { id: clientId },
      data: {
        wohnflaecheM2: validated.inquiry.wohnflaecheM2 ?? null,
        annualKwhGas: validated.inquiry.annualKwhGas ?? null,
        wohneinheiten: validated.inquiry.wohneinheiten ?? null,
        constructionYear: validated.inquiry.constructionYear ?? null,
        householdSize: validated.inquiry.householdSize ?? null,
        heizsystem: validated.inquiry.heizsystem ?? null,
        hotWaterIncluded: validated.inquiry.hotWaterIncluded ?? null,
        currentHeating: validated.inquiry.currentHeating ?? null,
        heatingAge: validated.inquiry.heatingAge ?? null,
        incomeRange: validated.inquiry.incomeRange ?? null,
        additionalInfo: validated.inquiry.additionalInfo ?? null,
      },
    });

    return tx.offer.create({
      data: {
        offerNumber,
        title: validated.title,
        validUntilDays: validated.validUntilDays,
        heatBalance: validated.heatBalance,
        serviceItems: validated.serviceItems,
        kfwFoerderung: validated.kfwFoerderung,
        clientId,
        createdById: session.user.id,
        positions: {
          create: validated.positions.map((p, idx) => ({
            catalogItemVariantId: p.catalogItemVariantId ?? null,
            name: p.name,
            description: p.description ?? null,
            itemType: p.itemType,
            manufacturer: p.manufacturer ?? null,
            photoStoragePath: p.photoStoragePath ?? null,
            technicalData: p.technicalData,
            unitPrice: p.unitPrice,
            quantity: p.quantity,
            order: p.order || idx,
          })),
        },
        discounts: {
          create: validated.discounts.map((d, idx) => ({
            label: d.label,
            description: d.description ?? null,
            kind: d.kind,
            value: d.value,
            order: d.order || idx,
          })),
        },
      },
    });
  });

  try {
    await regenerateOfferPdf(offer.id);
  } catch (e) {
    console.error("[Offer] PDF generation failed:", e);
  }

  revalidatePath(`/clients/${clientId}`);
  revalidatePath(`/clients/${clientId}/offers/${offer.id}`);
  return offer;
}

export async function saveOfferDraft(clientId: string, data: CreateOfferData) {
  const session = await requireAuth();
  const validated = draftOfferSchema.parse(data);

  const client = await db.client.findUnique({ where: { id: clientId } });
  if (!client) throw new Error("Kunde nicht gefunden");

  const offerNumber = await generateOfferNumber();

  const offer = await db.$transaction(async (tx) => {
    await tx.client.update({
      where: { id: clientId },
      data: {
        wohnflaecheM2: validated.inquiry.wohnflaecheM2 ?? null,
        annualKwhGas: validated.inquiry.annualKwhGas ?? null,
        wohneinheiten: validated.inquiry.wohneinheiten ?? null,
        constructionYear: validated.inquiry.constructionYear ?? null,
        householdSize: validated.inquiry.householdSize ?? null,
        heizsystem: validated.inquiry.heizsystem ?? null,
        hotWaterIncluded: validated.inquiry.hotWaterIncluded ?? null,
        currentHeating: validated.inquiry.currentHeating ?? null,
        heatingAge: validated.inquiry.heatingAge ?? null,
        incomeRange: validated.inquiry.incomeRange ?? null,
        additionalInfo: validated.inquiry.additionalInfo ?? null,
      },
    });
    return tx.offer.create({
      data: {
        offerNumber,
        title: validated.title,
        status: "DRAFT",
        validUntilDays: validated.validUntilDays,
        heatBalance: validated.heatBalance,
        serviceItems: validated.serviceItems,
        kfwFoerderung: validated.kfwFoerderung,
        clientId,
        createdById: session.user.id,
        positions: {
          create: validated.positions.map((p, idx) => ({
            catalogItemVariantId: p.catalogItemVariantId ?? null,
            name: p.name,
            description: p.description ?? null,
            itemType: p.itemType,
            manufacturer: p.manufacturer ?? null,
            photoStoragePath: p.photoStoragePath ?? null,
            technicalData: p.technicalData,
            unitPrice: p.unitPrice,
            quantity: p.quantity,
            order: p.order || idx,
          })),
        },
        discounts: {
          create: validated.discounts.map((d, idx) => ({
            label: d.label,
            description: d.description ?? null,
            kind: d.kind,
            value: d.value,
            order: d.order || idx,
          })),
        },
      },
    });
  });

  revalidatePath(`/clients/${clientId}`);
  return offer;
}

export async function regenerateOfferPdf(offerId: string) {
  await requireAuth();
  const offer = await db.offer.findUnique({
    where: { id: offerId },
    select: { id: true, clientId: true, offerNumber: true, pdfStoragePath: true },
  });
  if (!offer) throw new Error("Angebot nicht gefunden");

  const buffer = await renderOfferPdf(offerId);
  const fileName = `${offer.offerNumber}.pdf`;
  const storagePath = `offers/${offer.id}/${Date.now()}-${fileName}`;

  await uploadFile(storagePath, buffer, "application/pdf");

  if (offer.pdfStoragePath) {
    try {
      await deleteFile(offer.pdfStoragePath);
    } catch {
      // ignore
    }
  }

  await db.offer.update({
    where: { id: offerId },
    data: { pdfStoragePath: storagePath, pdfFileName: fileName },
  });

  revalidatePath(`/clients/${offer.clientId}/offers/${offerId}`);
  return { storagePath, fileName, size: buffer.length };
}

export async function sendOffer(offerId: string, data: SendOfferData) {
  const session = await requireAuth();
  const validated = sendOfferSchema.parse(data);

  const offer = await db.offer.findUnique({
    where: { id: offerId },
    include: { client: true },
  });
  if (!offer) throw new Error("Angebot nicht gefunden");
  if (!offer.client.email) throw new Error("Kunde hat keine E-Mail-Adresse");
  if (validated.attachPdf && !offer.pdfStoragePath) {
    throw new Error("PDF ist noch nicht generiert");
  }

  const company = (await db.companySettings.findFirst()) ?? DEFAULT_COMPANY;

  const html = await render(
    BrandedEmail({
      subject: validated.subject,
      body: validated.body,
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
    }),
  );

  const logoDataUri = getLogoBase64();
  const logoBuffer = Buffer.from(
    logoDataUri.replace(/^data:image\/\w+;base64,/, ""),
    "base64",
  );

  const attachments: { filename: string; content: Buffer; cid?: string }[] = [
    { filename: "logo.png", content: logoBuffer, cid: "logo" },
  ];

  if (validated.attachPdf && offer.pdfStoragePath) {
    const pdfBuffer = await getFileBuffer(offer.pdfStoragePath);
    attachments.push({
      filename: offer.pdfFileName ?? `${offer.offerNumber}.pdf`,
      content: pdfBuffer,
    });
  }

  const emailLog = await db.emailLog.create({
    data: {
      subject: validated.subject,
      body: validated.body,
      recipients: [offer.client.email],
      clientId: offer.clientId,
      sentById: session.user.id,
      status: "PENDING",
    },
  });

  try {
    await smtpTransporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: offer.client.email,
      subject: validated.subject,
      text: validated.body,
      html,
      attachments,
    });

    await db.emailLog.update({
      where: { id: emailLog.id },
      data: { status: "SENT" },
    });

    await db.offer.update({
      where: { id: offerId },
      data: {
        status: "SENT",
        sentAt: new Date(),
        emailSubject: validated.subject,
        emailBody: validated.body,
      },
    });
  } catch (e) {
    await db.emailLog.update({
      where: { id: emailLog.id },
      data: { status: "FAILED" },
    });
    throw e;
  }

  revalidatePath(`/clients/${offer.clientId}`);
  revalidatePath(`/clients/${offer.clientId}/offers/${offerId}`);
  return { success: true };
}

export async function deleteOffer(offerId: string) {
  await requireAuth();
  const offer = await db.offer.findUnique({
    where: { id: offerId },
    select: { id: true, clientId: true, status: true, pdfStoragePath: true },
  });
  if (!offer) throw new Error("Angebot nicht gefunden");
  if (offer.status !== "DRAFT") {
    throw new Error("Nur Entwürfe können gelöscht werden");
  }

  await db.offer.delete({ where: { id: offerId } });

  if (offer.pdfStoragePath) {
    try {
      await deleteFile(offer.pdfStoragePath);
    } catch {
      // ignore
    }
  }

  revalidatePath(`/clients/${offer.clientId}`);
}

export async function getOfferTotals(offerId: string) {
  await requireAuth();
  const offer = await db.offer.findUnique({
    where: { id: offerId },
    include: {
      positions: { orderBy: { order: "asc" } },
      discounts: { orderBy: { order: "asc" } },
    },
  });
  if (!offer) throw new Error("Angebot nicht gefunden");
  return calculateTotals(offer.positions, offer.discounts);
}
