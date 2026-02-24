"use client";

import { TextField, TextAreaField, CheckboxField, SelectField } from "../field-helpers";

type Props = {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  projectId: string;
};

export function ExistingSystemForm({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <SelectField
        data={data} onChange={onChange} field="currentHeatingType" label="Aktuelle Heizungsart"
        options={[
          { value: "gas", label: "Gasheizung" },
          { value: "oil", label: "Ölheizung" },
          { value: "electric", label: "Elektroheizung" },
          { value: "district", label: "Fernwärme" },
          { value: "wood", label: "Holz/Pellets" },
          { value: "other", label: "Sonstige" },
        ]}
      />
      <CheckboxField data={data} onChange={onChange} field="disposalRequired" label="Entsorgung der alten Anlage erforderlich" />
      {Boolean(data.disposalRequired) && (
        <TextAreaField data={data} onChange={onChange} field="disposalNotes" label="Entsorgungsdetails" placeholder="Details zur Entsorgung..." />
      )}
      <CheckboxField data={data} onChange={onChange} field="hasSolarPanels" label="Solarpanels vorhanden" />
      {Boolean(data.hasSolarPanels) && (
        <TextField data={data} onChange={onChange} field="solarPanelDetails" label="Solar-Details" placeholder="Leistung, Alter, etc." />
      )}
      <SelectField
        data={data} onChange={onChange} field="hotWaterSystem" label="Warmwasserbereitung"
        options={[
          { value: "combined", label: "Kombiniert mit Heizung" },
          { value: "separate_electric", label: "Separat elektrisch" },
          { value: "separate_solar", label: "Separat Solar" },
          { value: "heat_pump", label: "Über Wärmepumpe" },
        ]}
      />
      <TextAreaField data={data} onChange={onChange} field="notes" label="Anmerkungen" placeholder="Weitere Informationen zur Bestandsanlage..." />
    </div>
  );
}
