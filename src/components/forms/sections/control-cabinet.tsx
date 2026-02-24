"use client";

import { TextField, TextAreaField } from "../field-helpers";

type Props = {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  projectId: string;
};

export function ControlCabinetForm({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <TextField data={data} onChange={onChange} field="cabinetType" label="Schrank-Typ" placeholder="z.B. Aufputz, Unterputz" />
      <TextField data={data} onChange={onChange} field="dimensions" label="Maße (B x H x T in cm)" placeholder="z.B. 60 x 80 x 20" />
      <TextField data={data} onChange={onChange} field="location" label="Standort" placeholder="z.B. Keller neben Heizungsraum" />
      <TextAreaField data={data} onChange={onChange} field="notes" label="Anmerkungen" placeholder="Weitere Details zum Steuerschrank..." />
    </div>
  );
}
