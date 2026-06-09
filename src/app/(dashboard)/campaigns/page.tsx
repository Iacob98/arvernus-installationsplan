export const dynamic = "force-dynamic";

import { getTemplates, getCampaigns } from "@/lib/actions/campaigns";
import { listOfferReminderTemplates } from "@/lib/actions/offer-reminder-templates";
import { CampaignsPageContent } from "@/components/campaigns/campaigns-page-content";
import { auth } from "@/lib/auth";

export default async function CampaignsPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const [templates, campaigns, reminderTemplates] = await Promise.all([
    getTemplates(),
    getCampaigns(),
    isAdmin ? listOfferReminderTemplates() : Promise.resolve([]),
  ]);

  return (
    <CampaignsPageContent
      templates={templates}
      campaigns={campaigns}
      reminderTemplates={reminderTemplates}
      isAdmin={isAdmin}
    />
  );
}
