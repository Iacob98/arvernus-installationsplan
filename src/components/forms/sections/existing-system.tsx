"use client";

import {
  TextField,
  NumberField,
  TextAreaField,
  CheckboxField,
  SelectField,
  FormSubsection,
  YES_NO_OPTIONS,
} from "../field-helpers";

type Props = {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  projectId: string;
};

export function ExistingSystemForm({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <FormSubsection title="Bestandsanlage">
        <SelectField
          data={data} onChange={onChange} field="currentHeatingType" label="Aktuelle Heizungsart"
          options={[
            { value: "Erdgas", label: "Erdgas" },
            { value: "Gasheizung", label: "Gasheizung" },
            { value: "Ölheizung", label: "Ölheizung" },
            { value: "Elektroheizung", label: "Elektroheizung" },
            { value: "Fernwärme", label: "Fernwärme" },
            { value: "Holz/Pellets", label: "Holz/Pellets" },
            { value: "Sonstige", label: "Sonstige" },
          ]}
        />
        <TextField data={data} onChange={onChange} field="typenbezeichnungBestand" label="Typenbezeichnung Bestandanlage" placeholder="z.B. NeueHarzerWerke, Typenschild vorhanden" />
        <NumberField data={data} onChange={onChange} field="inbetriebnahmeJahr" label="Jahr der Inbetriebnahme der alten Heizanlage" placeholder="z.B. 1998" />
        <CheckboxField data={data} onChange={onChange} field="disposalRequired" label="Entsorgung der alten Anlage erforderlich" />
        {Boolean(data.disposalRequired) && (
          <TextAreaField data={data} onChange={onChange} field="disposalNotes" label="Entsorgungsdetails" placeholder="Details zur Entsorgung..." />
        )}
        <CheckboxField data={data} onChange={onChange} field="hasSolarPanels" label="Solarthermie / Solarpanels vorhanden" />
        {Boolean(data.hasSolarPanels) && (
          <TextField data={data} onChange={onChange} field="solarPanelDetails" label="Solar-Details" placeholder="Leistung, Alter, etc." />
        )}
      </FormSubsection>

      <FormSubsection title="Gas-Daten">
        <SelectField data={data} onChange={onChange} field="ruckbauGasleitung" label="Rückbau alter Gasleitung" options={YES_NO_OPTIONS} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField data={data} onChange={onChange} field="gaszaehlerNummer" label="Gaszählernummer" placeholder="z.B. 1040059298" />
          <NumberField data={data} onChange={onChange} field="gaszaehlerStandM3" label="Gaszählerstand (m³)" placeholder="z.B. 47394" />
        </div>
      </FormSubsection>

      <FormSubsection title="Warmwasser & Hydraulik (Bestand)">
        <SelectField
          data={data} onChange={onChange} field="hotWaterSystem" label="Warmwasserbereitung"
          options={[
            { value: "Kombiniert mit Heizung", label: "Kombiniert mit Heizung" },
            { value: "Separat elektrisch", label: "Separat elektrisch" },
            { value: "Separat Solar", label: "Separat Solar" },
            { value: "Über Wärmepumpe", label: "Über Wärmepumpe" },
          ]}
        />
        <SelectField data={data} onChange={onChange} field="warmwasserUeberHeizung" label="Warmwasserbereitung über Heizungsanlage" options={YES_NO_OPTIONS} />
        <SelectField
          data={data} onChange={onChange} field="zirkulationsleitung" label="Zirkulationsleitung vorhanden"
          options={[
            { value: "Ja, Zirkulationspumpe installieren", label: "Ja, Zirkulationspumpe installieren" },
            { value: "Ja, vorhanden", label: "Ja, vorhanden" },
            { value: "Nein", label: "Nein" },
          ]}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField data={data} onChange={onChange} field="druckminderer" label="Druckminderer vorhanden" options={YES_NO_OPTIONS} />
          <SelectField data={data} onChange={onChange} field="kondensatpumpe" label="Kondensatpumpe notwendig" options={YES_NO_OPTIONS} />
        </div>
      </FormSubsection>

      <TextAreaField data={data} onChange={onChange} field="notes" label="Anmerkungen" placeholder="Weitere Informationen zur Bestandsanlage..." />
    </div>
  );
}
