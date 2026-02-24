"use client";

import { TextField, TextAreaField } from "../field-helpers";

type Props = {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  projectId: string;
};

export function CableRoutesForm({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <TextField data={data} onChange={onChange} field="cableLength" label="Kabellänge (m)" placeholder="z.B. 25" />
      <TextAreaField data={data} onChange={onChange} field="routeDescription" label="Kabelweg-Beschreibung" placeholder="Beschreibung des Kabelwegs..." rows={4} />
      <TextAreaField data={data} onChange={onChange} field="floorPlan" label="Grundriss-Notizen" placeholder="Notizen zum Grundriss und Farbmarkierung..." />
      <TextAreaField data={data} onChange={onChange} field="notes" label="Anmerkungen" placeholder="Weitere Details..." />
    </div>
  );
}
