"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { updateOwnSignature } from "@/lib/actions/users";

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
};

function previewHtml(sig: string): string {
  const safe = sig.replace(/[&<>]/g, (c) => HTML_ESCAPES[c]!).replace(
    /\r?\n/g,
    "<br>",
  );
  return `<div style="font-family:Segoe UI,Tahoma,Geneva,sans-serif;font-size:14px;line-height:1.5;color:#333">${safe}</div>`;
}

interface Props {
  initialSignature: string;
}

export function ProfileForm({ initialSignature }: Props) {
  const [signature, setSignature] = useState(initialSignature);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      try {
        await updateOwnSignature(signature);
        toast.success("Signatur gespeichert");
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Fehler beim Speichern",
        );
      }
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">E-Mail-Signatur</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Label htmlFor="signature">Signatur (Klartext)</Label>
          <textarea
            id="signature"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            rows={10}
            placeholder={
              "Mit freundlichen Grüßen\nMax Mustermann\nArvernus Meisterbetrieb\n+49 0123 456789\nmax@arvernus-energie.de"
            }
            className="w-full font-mono text-xs border border-input rounded-md bg-background px-3 py-2"
          />
          <p className="text-xs text-muted-foreground">
            Wird automatisch nach dem Trenner{" "}
            <code className="bg-muted px-1 rounded">{"-- "}</code> an jede
            E-Mail angehängt. Zeilenumbrüche werden übernommen.
          </p>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={pending}>
              {pending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Speichern
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vorschau</CardTitle>
        </CardHeader>
        <CardContent>
          <iframe
            srcDoc={previewHtml(signature)}
            sandbox=""
            className="w-full h-[280px] border rounded bg-white"
            title="Signatur Vorschau"
          />
        </CardContent>
      </Card>
    </div>
  );
}
