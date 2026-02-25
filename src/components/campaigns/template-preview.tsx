"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Send, Trash2 } from "lucide-react";
import { deleteTemplate } from "@/lib/actions/campaigns";
import { toast } from "sonner";
import Link from "next/link";

type Image = {
  id: string;
  filename: string;
  cid: string;
  url: string;
};

type Props = {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  images: Image[];
};

export function TemplatePreview({ id, name, subject, htmlContent, images }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  // Replace cid: references with presigned URLs for preview
  let previewHtml = htmlContent;
  for (const img of images) {
    previewHtml = previewHtml.replace(
      new RegExp(`src=["']cid:${img.cid.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']`, "g"),
      `src="${img.url}"`
    );
  }

  async function handleDelete() {
    if (!confirm("Vorlage wirklich löschen?")) return;
    setDeleting(true);
    try {
      await deleteTemplate(id);
      toast.success("Vorlage gelöscht");
      router.push("/campaigns");
    } catch (error) {
      toast.error("Fehler beim Löschen");
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">Betreff: {subject}</p>
            </div>
            <div className="flex gap-2">
              <Button asChild>
                <Link href={`/campaigns/new?templateId=${id}`}>
                  <Send className="h-4 w-4 mr-2" />
                  Kampagne erstellen
                </Link>
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <iframe
            srcDoc={previewHtml}
            sandbox=""
            className="w-full h-[600px] border rounded"
            title="Vorlagen-Vorschau"
          />
        </CardContent>
      </Card>
    </div>
  );
}
