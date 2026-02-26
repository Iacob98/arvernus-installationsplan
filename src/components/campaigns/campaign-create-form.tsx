"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Send } from "lucide-react";
import { createCampaign, getRecipientCount } from "@/lib/actions/campaigns";
import { toast } from "sonner";

type Template = {
  id: string;
  name: string;
  subject: string;
};

type Props = {
  templates: Template[];
};

export function CampaignCreateForm({ templates }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedTemplateId = searchParams.get("templateId") || "";

  const [loading, setLoading] = useState(false);
  const [templateId, setTemplateId] = useState(preselectedTemplateId);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [recipientCount, setRecipientCount] = useState<number | null>(null);

  useEffect(() => {
    getRecipientCount(statusFilter).then(setRecipientCount).catch(() => setRecipientCount(null));
  }, [statusFilter]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const name = formData.get("name") as string;

      await createCampaign({
        name,
        templateId,
        statusFilter: statusFilter as "ALL" | "IN_BEARBEITUNG" | "VERKAUFT" | "NICHT_VERKAUFT",
      });

      toast.success("Kampagne erstellt und E-Mails werden gesendet");
      router.push("/campaigns");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fehler beim Erstellen");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Neue Kampagne</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Kampagnenname</Label>
            <Input
              id="name"
              name="name"
              placeholder="z.B. Frühlings-Kampagne 2026"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Vorlage</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Vorlage auswählen" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name} — {t.subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Empfänger filtern</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Alle Kunden</SelectItem>
                <SelectItem value="NEU">Neu</SelectItem>
                <SelectItem value="IN_BEARBEITUNG">In Bearbeitung</SelectItem>
                <SelectItem value="VERKAUFT">Verkauft</SelectItem>
                <SelectItem value="NICHT_VERKAUFT">Nicht Verkauft</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {recipientCount !== null && (
            <p className="text-sm text-muted-foreground">
              {recipientCount} Empfänger mit E-Mail-Adresse
            </p>
          )}
        </CardContent>
      </Card>

      <Button type="submit" disabled={loading || !templateId}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Wird erstellt...
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            Kampagne starten
          </>
        )}
      </Button>
    </form>
  );
}
