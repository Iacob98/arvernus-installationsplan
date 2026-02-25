import { TemplateUploadForm } from "@/components/campaigns/template-upload-form";

export default function NewTemplatePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Neue Vorlage</h1>
      <TemplateUploadForm />
    </div>
  );
}
