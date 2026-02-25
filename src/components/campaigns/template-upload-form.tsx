"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

export function TemplateUploadForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [htmlPreview, setHtmlPreview] = useState<string | null>(null);

  function handleHtmlSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setHtmlPreview(reader.result as string);
    reader.readAsText(file);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const form = e.currentTarget;
      const formData = new FormData(form);

      const res = await fetch("/api/campaigns/templates/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload fehlgeschlagen");
      }

      const { id } = await res.json();
      toast.success("Vorlage erfolgreich hochgeladen");
      router.push(`/campaigns/templates/${id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Vorlage hochladen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="z.B. Frühlings-Newsletter"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">E-Mail Betreff</Label>
            <Input
              id="subject"
              name="subject"
              placeholder="z.B. Unser Frühlings-Angebot"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="html">HTML-Datei</Label>
            <Input
              id="html"
              name="html"
              type="file"
              accept=".html,.htm"
              required
              onChange={handleHtmlSelect}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="images">Bilder</Label>
            <Input
              id="images"
              name="images"
              type="file"
              accept="image/*"
              multiple
            />
            <p className="text-xs text-muted-foreground">
              Laden Sie alle Bilder hoch, die in der HTML-Vorlage referenziert werden.
            </p>
          </div>
        </CardContent>
      </Card>

      {htmlPreview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vorschau</CardTitle>
          </CardHeader>
          <CardContent>
            <iframe
              srcDoc={htmlPreview}
              sandbox=""
              className="w-full h-[500px] border rounded"
              title="HTML Vorschau"
            />
          </CardContent>
        </Card>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Wird hochgeladen...
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Vorlage hochladen
          </>
        )}
      </Button>
    </form>
  );
}
