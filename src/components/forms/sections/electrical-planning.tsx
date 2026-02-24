"use client";

import { TextField, TextAreaField, CheckboxField, SelectField } from "../field-helpers";

type Props = {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  projectId: string;
};

export function ElectricalPlanningForm({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <SelectField
        data={data} onChange={onChange} field="mainFuseSize" label="Hauptsicherung"
        options={[
          { value: "25A", label: "25A" },
          { value: "35A", label: "35A" },
          { value: "50A", label: "50A" },
          { value: "63A", label: "63A" },
        ]}
      />
      <CheckboxField data={data} onChange={onChange} field="hasPvSystem" label="PV-Anlage vorhanden" />
      {Boolean(data.hasPvSystem) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField data={data} onChange={onChange} field="pvSystemSize" label="PV-Leistung (kWp)" placeholder="z.B. 10" />
          <TextField data={data} onChange={onChange} field="inverterType" label="Wechselrichter" placeholder="Hersteller/Modell" />
        </div>
      )}
      <CheckboxField data={data} onChange={onChange} field="batteryStorage" label="Batteriespeicher vorhanden" />
      {Boolean(data.batteryStorage) && (
        <TextField data={data} onChange={onChange} field="batteryCapacity" label="Batteriekapazität (kWh)" placeholder="z.B. 10" />
      )}
      <TextAreaField data={data} onChange={onChange} field="notes" label="Anmerkungen" placeholder="Elektroplanung Details..." />
    </div>
  );
}
