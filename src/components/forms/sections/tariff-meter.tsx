"use client";

import { TextField, TextAreaField, SelectField } from "../field-helpers";

type Props = {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  projectId: string;
};

export function TariffMeterForm({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <SelectField
        data={data} onChange={onChange} field="tariffType" label="Tarifart"
        options={[
          { value: "heat_pump", label: "Wärmepumpentarif" },
          { value: "standard", label: "Standardtarif" },
          { value: "dual", label: "Doppeltarif" },
        ]}
      />
      <TextField data={data} onChange={onChange} field="meterNumber" label="Zählernummer" placeholder="Zählernummer eingeben" />
      <TextField data={data} onChange={onChange} field="meterLocation" label="Zählerstandort" placeholder="z.B. Keller, Hauswirtschaftsraum" />
      <TextAreaField data={data} onChange={onChange} field="notes" label="Anmerkungen" placeholder="Weitere Informationen..." />
    </div>
  );
}
