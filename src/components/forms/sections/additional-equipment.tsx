"use client";

import { TextField, TextAreaField } from "../field-helpers";

type Props = {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  projectId: string;
};

export function AdditionalEquipmentForm({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <TextField data={data} onChange={onChange} field="storageLocation" label="Lagerort" placeholder="z.B. Garage, Keller" />
      <TextAreaField data={data} onChange={onChange} field="equipmentList" label="Ausstattungsliste" placeholder="Liste der zusätzlichen Geräte und Materialien..." rows={4} />
      <TextAreaField data={data} onChange={onChange} field="notes" label="Anmerkungen" placeholder="Weitere Details..." />
    </div>
  );
}
