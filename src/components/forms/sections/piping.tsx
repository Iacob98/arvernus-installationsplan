"use client";

import { NumberField, TextField, TextAreaField, SelectField } from "../field-helpers";

type Props = {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  projectId: string;
};

export function PipingForm({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NumberField data={data} onChange={onChange} field="wallPenetrations" label="Wanddurchbrüche" min={0} />
        <NumberField data={data} onChange={onChange} field="floorPenetrations" label="Deckendurchbrüche" min={0} />
      </div>
      <TextField data={data} onChange={onChange} field="pipeLength" label="Rohrleitungslänge (m)" placeholder="z.B. 15" />
      <SelectField
        data={data} onChange={onChange} field="insulationType" label="Isolierung"
        options={[
          { value: "standard", label: "Standard" },
          { value: "enhanced", label: "Verstärkt" },
          { value: "none", label: "Keine" },
        ]}
      />
      <TextAreaField data={data} onChange={onChange} field="notes" label="Anmerkungen" placeholder="Details zu Rohrleitungen..." />
    </div>
  );
}
