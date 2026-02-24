"use client";

import { TextField, TextAreaField } from "../field-helpers";

type Props = {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  projectId: string;
};

export function TitlePageForm({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <TextField data={data} onChange={onChange} field="projectTitle" label="Projekttitel" placeholder="z.B. Installationsplan Wärmepumpe" />
      <TextField data={data} onChange={onChange} field="subtitle" label="Untertitel" placeholder="z.B. Luft-Wasser-Wärmepumpe" />
      <TextAreaField data={data} onChange={onChange} field="additionalInfo" label="Zusätzliche Informationen" placeholder="Optionale Infos für die Titelseite..." />
    </div>
  );
}
