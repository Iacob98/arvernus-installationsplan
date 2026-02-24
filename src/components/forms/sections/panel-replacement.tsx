"use client";

import { TextField, TextAreaField, CheckboxField } from "../field-helpers";

type Props = {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  projectId: string;
};

export function PanelReplacementForm({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <CheckboxField data={data} onChange={onChange} field="replacementRequired" label="Zählerschranktausch erforderlich" />
      {Boolean(data.replacementRequired) && (
        <>
          <TextField data={data} onChange={onChange} field="newPanelLocation" label="Neuer Standort" placeholder="z.B. Keller, Flur" />
          <TextAreaField data={data} onChange={onChange} field="instructions" label="Anweisungen" placeholder="Anweisungen für den Tausch..." />
        </>
      )}
      <TextAreaField data={data} onChange={onChange} field="notes" label="Anmerkungen" placeholder="Weitere Details..." />
    </div>
  );
}
