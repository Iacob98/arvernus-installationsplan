"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  updateOfferReminderTemplate,
  previewOfferReminderTemplate,
} from "@/lib/actions/offer-reminder-templates";

interface Props {
  step: number;
  delayDays: number;
  initialSubject: string;
  initialHtmlBody: string;
}

const PREVIEW_VARS = {
  firstName: "Andreas",
  managerName: "Sergej Alchits",
};

export function ReminderTemplateEditor({
  step,
  delayDays,
  initialSubject,
  initialHtmlBody,
}: Props) {
  const [subject, setSubject] = useState(initialSubject);
  const [htmlBody, setHtmlBody] = useState(initialHtmlBody);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [saving, startSaveTransition] = useTransition();
  const [previewing, startPreviewTransition] = useTransition();

  useEffect(() => {
    const t = setTimeout(() => {
      startPreviewTransition(async () => {
        try {
          // Use saved template state on server for preview — debounced.
          // For unsaved edits we still call with PREVIEW_VARS; server uses
          // the persisted template, so user sees the last saved version
          // until they save. To preview live edits, save first.
          const html = await previewOfferReminderTemplate(step, PREVIEW_VARS);
          setPreviewHtml(html);
        } catch (e) {
          console.error(e);
        }
      });
    }, 400);
    return () => clearTimeout(t);
  }, [step]);

  function handleSave() {
    startSaveTransition(async () => {
      try {
        await updateOfferReminderTemplate(step, { subject, htmlBody });
        toast.success("Vorlage gespeichert");
        // Refresh preview after save
        const html = await previewOfferReminderTemplate(step, PREVIEW_VARS);
        setPreviewHtml(html);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Fehler beim Speichern");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/campaigns">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zurück
          </Link>
        </Button>
        <h1 className="text-xl font-semibold">
          Erinnerungs-Vorlage Schritt {step}
        </h1>
        <span className="text-sm text-muted-foreground">
          (versendet am Tag {delayDays} nach Angebot)
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bearbeiten</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="subject">Betreff</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Betreff..."
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="htmlBody">HTML-Inhalt</Label>
              <textarea
                id="htmlBody"
                value={htmlBody}
                onChange={(e) => setHtmlBody(e.target.value)}
                rows={20}
                className="w-full font-mono text-xs border border-input rounded-md bg-background px-3 py-2"
              />
              <p className="text-xs text-muted-foreground">
                Platzhalter:{" "}
                <code className="bg-muted px-1 rounded">{"{{firstName}}"}</code>{" "}
                ·{" "}
                <code className="bg-muted px-1 rounded">{"{{managerName}}"}</code>
              </p>
            </div>
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving || !subject || !htmlBody}
              >
                {saving ? (
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
            <CardTitle className="text-base">
              Vorschau{" "}
              {previewing && (
                <Loader2 className="h-3 w-3 inline animate-spin ml-2" />
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-2">
              Vorschau verwendet die gespeicherte Version — nach dem Speichern
              wird sie aktualisiert.
            </p>
            <iframe
              srcDoc={previewHtml}
              sandbox=""
              className="w-full h-[400px] sm:h-[500px] lg:h-[600px] border rounded bg-white"
              title={`Vorschau Schritt ${step}`}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
