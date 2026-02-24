"use client";

import { TextField, TextAreaField, SelectField } from "../field-helpers";

type Props = {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  projectId: string;
};

export function HydraulicsForm({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <SelectField
        data={data} onChange={onChange} field="indoorUnitType" label="Inneneinheit"
        options={[
          { value: "wall_mounted", label: "Wandgerät" },
          { value: "floor_standing", label: "Standgerät" },
          { value: "compact", label: "Kompaktgerät" },
        ]}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField data={data} onChange={onChange} field="bufferTankVolume" label="Pufferspeicher (Liter)" placeholder="z.B. 200" />
        <TextField data={data} onChange={onChange} field="hotWaterTankVolume" label="Warmwasserspeicher (Liter)" placeholder="z.B. 300" />
      </div>
      <TextAreaField data={data} onChange={onChange} field="notes" label="Anmerkungen" placeholder="Hydraulik-Details..." />
    </div>
  );
}
