"use client";

import { TextField, NumberField, TextAreaField, FormSubsection } from "../field-helpers";

type Props = {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  projectId: string;
};

export function TechnicalPlanningForm({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <FormSubsection title="Auslegung">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField data={data} onChange={onChange} field="normHeatLoad" label="Norm-Gebäudeheizlast (kW)" placeholder="z.B. 7.1" />
          <NumberField data={data} onChange={onChange} field="normOutdoorTemp" label="Normaußentemperatur (°C)" placeholder="z.B. -13.2" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField data={data} onChange={onChange} field="bivalencePoint" label="Bivalenzpunkt (°C)" placeholder="z.B. -6" />
          <TextField data={data} onChange={onChange} field="kwClass" label="Zu verbauende kW-Klasse" placeholder="z.B. 7 kW" />
        </div>
      </FormSubsection>

      <FormSubsection title="Wärmepumpe">
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
      </FormSubsection>

      <TextAreaField data={data} onChange={onChange} field="notes" label="Anmerkungen" placeholder="Technische Besonderheiten..." />
    </div>
  );
}
