export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOfferReminderTemplate } from "@/lib/actions/offer-reminder-templates";
import { ReminderTemplateEditor } from "@/components/campaigns/reminder-template-editor";

const REMINDER_DAYS: Record<number, number> = { 1: 2, 2: 5, 3: 6, 4: 10 };

export default async function ReminderTemplateEditPage({
  params,
}: {
  params: Promise<{ step: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ADMIN") redirect("/campaigns");

  const { step: stepParam } = await params;
  const step = Number(stepParam);
  if (!Number.isInteger(step) || !(step in REMINDER_DAYS)) notFound();

  const template = await getOfferReminderTemplate(step);
  if (!template) notFound();

  return (
    <ReminderTemplateEditor
      step={template.step}
      delayDays={REMINDER_DAYS[step]}
      initialSubject={template.subject}
      initialHtmlBody={template.htmlBody}
    />
  );
}
