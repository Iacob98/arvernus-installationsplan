"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-utils";
import { renderBrandedHtmlEmail } from "@/lib/email/template";
import { replaceTemplateVars } from "@/lib/template-vars";
import { getLogoBase64 } from "@/lib/pdf/logo";

const updateSchema = z.object({
  subject: z.string().min(1, "Betreff ist erforderlich").max(200),
  htmlBody: z.string().min(1, "Inhalt ist erforderlich"),
});

export type OfferReminderTemplateUpdate = z.infer<typeof updateSchema>;

export async function listOfferReminderTemplates() {
  await requireAdmin();
  return db.offerReminderTemplate.findMany({ orderBy: { step: "asc" } });
}

export async function getOfferReminderTemplate(step: number) {
  await requireAdmin();
  return db.offerReminderTemplate.findUnique({ where: { step } });
}

export async function updateOfferReminderTemplate(
  step: number,
  data: OfferReminderTemplateUpdate,
) {
  await requireAdmin();
  const validated = updateSchema.parse(data);
  return db.offerReminderTemplate.update({
    where: { step },
    data: validated,
  });
}

export async function previewOfferReminderTemplate(
  step: number,
  vars: { firstName: string; managerName: string },
): Promise<string> {
  await requireAdmin();

  const template = await db.offerReminderTemplate.findUnique({ where: { step } });
  if (!template) throw new Error("Vorlage nicht gefunden");

  const company =
    (await db.companySettings.findFirst()) ?? {
      name: "Arvernus",
      street: "",
      postalCode: "",
      city: "",
      phone: null,
      email: null,
      website: null,
      primaryColor: "#1565C0",
    };

  const htmlBody = replaceTemplateVars(template.htmlBody, vars);

  return renderBrandedHtmlEmail({
    subject: replaceTemplateVars(template.subject, vars),
    htmlBody,
    // In preview the email is shown inside an iframe — there is no SMTP
    // attachment to resolve `cid:logo`, so we inline the logo as data URI.
    logoSrc: getLogoBase64(),
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
}
