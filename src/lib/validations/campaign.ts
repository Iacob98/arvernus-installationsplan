import { z } from "zod";

export const templateUploadSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  subject: z.string().min(1, "Betreff ist erforderlich"),
});

export type TemplateUploadFormData = z.infer<typeof templateUploadSchema>;

export const campaignCreateSchema = z.object({
  name: z.string().min(1, "Name ist erforderlich"),
  templateId: z.string().min(1, "Vorlage ist erforderlich"),
  statusFilter: z.enum(["ALL", "IN_BEARBEITUNG", "VERKAUFT", "NICHT_VERKAUFT"]).optional(),
});

export type CampaignCreateFormData = z.infer<typeof campaignCreateSchema>;
