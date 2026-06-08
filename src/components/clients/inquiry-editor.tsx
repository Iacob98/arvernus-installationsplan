"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";
import {
  updateClientInquiry,
  type ClientDetail,
} from "@/lib/actions/clients";

const INQUIRY_FIELDS: { key: keyof ClientDetail; label: string }[] = [
  { key: "wohnflaecheM2", label: "Beheizte Wohnfläche (m²)" },
  { key: "annualKwhGas", label: "Jahresverbrauch (kWh / Öl / m³)" },
  { key: "wohneinheiten", label: "Anzahl Wohneinheiten" },
  { key: "heizsystem", label: "Heizsystem" },
  { key: "hotWaterIncluded", label: "Warmwasser durch Wärmepumpe" },
  { key: "currentHeating", label: "Aktueller Heizungstyp" },
  { key: "heatingAge", label: "Alter / Baujahr der Heizung" },
  { key: "incomeRange", label: "Haushaltseinkommen / Jahr" },
  { key: "ownership", label: "Eigentumsverhältnis" },
  { key: "buildingType", label: "Gebäudetyp" },
  { key: "constructionYear", label: "Baujahr" },
  { key: "householdSize", label: "Personenanzahl" },
  { key: "currentFuel", label: "Genutzter Brennstoff" },
  { key: "timeframe", label: "Zeitrahmen" },
  { key: "availability", label: "Erreichbarkeit" },
  { key: "annualLitersOil", label: "Jahresverbrauch (L Heizöl)" },
];

export function InquiryEditor({ client }: { client: ClientDetail }) {
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [draft, setDraft] = useState<Record<string, string>>(() => {
    const d: Record<string, string> = {};
    for (const f of INQUIRY_FIELDS) d[f.key] = (client[f.key] as string) ?? "";
    d.additionalInfo = client.additionalInfo ?? "";
    return d;
  });

  function startEdit() {
    const d: Record<string, string> = {};
    for (const f of INQUIRY_FIELDS) d[f.key] = (client[f.key] as string) ?? "";
    d.additionalInfo = client.additionalInfo ?? "";
    setDraft(d);
    setEditing(true);
  }

  function save() {
    startTransition(async () => {
      try {
        await updateClientInquiry(client.id, draft);
        toast.success("Gespeichert");
        setEditing(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Fehler");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Anfragedetails</CardTitle>
        {editing ? (
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={pending}>
              <X className="h-4 w-4 mr-1" /> Abbrechen
            </Button>
            <Button size="sm" onClick={save} disabled={pending}>
              <Check className="h-4 w-4 mr-1" /> {pending ? "Speichern…" : "Speichern"}
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={startEdit}>
            <Pencil className="h-3 w-3 mr-1" /> Bearbeiten
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {INQUIRY_FIELDS.map((f) => (
            <div key={f.key} className="space-y-1">
              <Label className="text-xs text-muted-foreground">{f.label}</Label>
              {editing ? (
                <Input
                  value={draft[f.key] ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
                />
              ) : (
                <p className="text-sm">
                  {(client[f.key] as string) || (
                    <span className="text-muted-foreground/60">—</span>
                  )}
                </p>
              )}
            </div>
          ))}
        </div>
        <div className="space-y-1 pt-2 border-t">
          <Label className="text-xs text-muted-foreground">
            Zusätzliche Projektinformationen
          </Label>
          {editing ? (
            <Textarea
              rows={3}
              value={draft.additionalInfo ?? ""}
              onChange={(e) =>
                setDraft((d) => ({ ...d, additionalInfo: e.target.value }))
              }
            />
          ) : client.additionalInfo ? (
            <p className="text-sm whitespace-pre-wrap">{client.additionalInfo}</p>
          ) : (
            <p className="text-sm text-muted-foreground/60">—</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
