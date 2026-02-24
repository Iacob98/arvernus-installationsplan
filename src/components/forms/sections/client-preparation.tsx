"use client";

import { TextAreaField } from "../field-helpers";

type Props = {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  projectId: string;
};

export function ClientPreparationForm({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Die folgenden Texte erscheinen als Info-Karten im PDF für den Kunden. Sie können die Standardtexte anpassen.
      </p>

      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="font-medium">🧹 Frei geräumte Aufstellorte</h3>
        <TextAreaField
          data={data} onChange={onChange} field="clearAreaText"
          label="Text"
          placeholder="Die mit Ihnen abgestimmten Aufstellorte müssen für die Einsätze komplett freigeräumt sein..."
          rows={3}
        />
      </div>

      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="font-medium">⚠️ Freier Zugang zu allen Arbeitsorten</h3>
        <TextAreaField
          data={data} onChange={onChange} field="accessText"
          label="Text"
          placeholder="Bitte stellen Sie sicher, dass unsere Teams möglichst direkt auf alle Aufstellorte zugreifen können..."
          rows={3}
        />
      </div>

      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="font-medium">📶 Vorbereitung des Internetanschlusses</h3>
        <TextAreaField
          data={data} onChange={onChange} field="internetText"
          label="Text"
          placeholder="Für die Internetanbindung Ihrer Wärmepumpe wird eine kabelgebundene Internetverbindung benötigt..."
          rows={3}
        />
        <TextAreaField
          data={data} onChange={onChange} field="internetHint"
          label="Hinweis (optional)"
          placeholder="Falls eine direkte Kabelverbindung nicht möglich ist..."
          rows={2}
        />
      </div>

      <TextAreaField data={data} onChange={onChange} field="notes" label="Anmerkungen" placeholder="Weitere Hinweise für den Kunden..." />
    </div>
  );
}
