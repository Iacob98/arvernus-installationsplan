export const dynamic = "force-dynamic";

import { getTemplate } from "@/lib/actions/campaigns";
import { TemplatePreview } from "@/components/campaigns/template-preview";
import { notFound } from "next/navigation";

export default async function TemplatePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const template = await getTemplate(id);
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Vorlagen-Vorschau</h1>
        <TemplatePreview
          id={template.id}
          name={template.name}
          subject={template.subject}
          htmlContent={template.htmlCid}
          images={template.images}
        />
      </div>
    );
  } catch {
    notFound();
  }
}
