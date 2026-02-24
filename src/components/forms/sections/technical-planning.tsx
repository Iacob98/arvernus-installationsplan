"use client";

import { TextField, TextAreaField } from "../field-helpers";

type Props = {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  projectId: string;
};

export function TechnicalPlanningForm({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField data={data} onChange={onChange} field="heatPumpModel" label="Wärmepumpen-Modell" placeholder="z.B. Vaillant aroTHERM plus" />
        <TextField data={data} onChange={onChange} field="manufacturer" label="Hersteller" placeholder="z.B. Vaillant" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField data={data} onChange={onChange} field="heatingCapacity" label="Heizleistung (kW)" placeholder="z.B. 12" />
        <TextField data={data} onChange={onChange} field="coolingCapacity" label="Kühlleistung (kW)" placeholder="z.B. 8" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField data={data} onChange={onChange} field="flowTemperature" label="Vorlauftemperatur (°C)" placeholder="z.B. 55" />
        <TextField data={data} onChange={onChange} field="returnTemperature" label="Rücklauftemperatur (°C)" placeholder="z.B. 45" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField data={data} onChange={onChange} field="refrigerant" label="Kältemittel" placeholder="z.B. R290" />
        <TextField data={data} onChange={onChange} field="soundPowerLevel" label="Schallleistungspegel (dB)" placeholder="z.B. 56" />
      </div>
      <TextField data={data} onChange={onChange} field="cop" label="COP" placeholder="z.B. 4.5" />
      <TextAreaField data={data} onChange={onChange} field="notes" label="Anmerkungen" placeholder="Technische Besonderheiten..." />
    </div>
  );
}
