export const dynamic = "force-dynamic";

import { getTemplates } from "@/lib/actions/campaigns";
import { CampaignCreateForm } from "@/components/campaigns/campaign-create-form";

export default async function NewCampaignPage() {
  const templates = await getTemplates();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Neue Kampagne</h1>
      <CampaignCreateForm
        templates={templates.map((t: { id: string; name: string; subject: string }) => ({
          id: t.id,
          name: t.name,
          subject: t.subject,
        }))}
      />
    </div>
  );
}
