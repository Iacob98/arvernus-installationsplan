export const dynamic = "force-dynamic";

import { getTemplates, getCampaigns } from "@/lib/actions/campaigns";
import { CampaignsPageContent } from "@/components/campaigns/campaigns-page-content";

export default async function CampaignsPage() {
  const [templates, campaigns] = await Promise.all([
    getTemplates(),
    getCampaigns(),
  ]);

  return <CampaignsPageContent templates={templates} campaigns={campaigns} />;
}
