"use client";

import { TextField, TextAreaField, CheckboxField } from "../field-helpers";

type Props = {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  projectId: string;
};

export function ConsentForm({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted rounded-lg">
        <p className="text-sm">
          Mit der Zustimmung bestätigt der Kunde, dass alle Angaben korrekt sind
          und die Installationsarbeiten wie im Plan beschrieben durchgeführt werden
          können.
        </p>
      </div>
      <CheckboxField data={data} onChange={onChange} field="customerAgreed" label="Kunde hat zugestimmt" />
      <TextField data={data} onChange={onChange} field="signatureDate" label="Datum der Unterschrift" type="date" />
      <TextAreaField data={data} onChange={onChange} field="notes" label="Anmerkungen" placeholder="Eventuelle Vorbehalte oder Anmerkungen des Kunden..." />
    </div>
  );
}
