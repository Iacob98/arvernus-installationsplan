"use client";

import {
  TextField,
  TextAreaField,
  CheckboxField,
  SelectField,
  FormSubsection,
  YES_NO_OPTIONS,
  SUFFICIENT_OPTIONS,
} from "../field-helpers";

type Props = {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  projectId: string;
};

export function ElectricalPlanningForm({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <FormSubsection title="Hausanschlusskasten (HAK)">
        <SelectField data={data} onChange={onChange} field="hakAusreichend" label="HAK ausreichend" options={SUFFICIENT_OPTIONS} />
        <TextField data={data} onChange={onChange} field="hakAufstellort" label="Aufstellort HAK" placeholder="z.B. Im Keller" />
        <SelectField data={data} onChange={onChange} field="hakPotentialausgleich" label="HAK Potentialausgleich vorhanden" options={YES_NO_OPTIONS} />
        <SelectField
          data={data} onChange={onChange} field="mainFuseSize" label="Hauptsicherung"
          options={[
            { value: "25A", label: "25 A" },
            { value: "35A", label: "35 A" },
            { value: "50A", label: "50 A" },
            { value: "63A", label: "63 A" },
          ]}
        />
      </FormSubsection>

      <FormSubsection title="Potentialausgleich & Erdung">
        <SelectField data={data} onChange={onChange} field="potentialausgleichAusreichend" label="Potentialausgleich ausreichend" options={SUFFICIENT_OPTIONS} />
        <TextField data={data} onChange={onChange} field="potentialausgleichAusfuehrung" label="Ausführung Potentialausgleich" placeholder="z.B. Schiene vorhanden, Tiefenerder setzen" />
        <SelectField data={data} onChange={onChange} field="tiefenerderErforderlich" label="Tiefenerder erforderlich" options={YES_NO_OPTIONS} />
      </FormSubsection>

      <FormSubsection title="HEMS / Internet">
        <SelectField
          data={data} onChange={onChange} field="hemsInternetVerbindung" label="Internetverbindung für t-smart"
          options={[
            { value: "Powerline", label: "Powerline" },
            { value: "LAN", label: "LAN" },
            { value: "WLAN", label: "WLAN" },
            { value: "Nicht vorhanden", label: "Nicht vorhanden" },
          ]}
        />
        <SelectField data={data} onChange={onChange} field="hemsLanBuchseFrei" label="LAN-Buchse für HEMS frei" options={YES_NO_OPTIONS} />
        <SelectField
          data={data} onChange={onChange} field="hemsSteckdoseRouter" label="Steckdose nahe dem Router"
          options={[
            { value: "Vorhanden", label: "Vorhanden" },
            { value: "Freizuräumen", label: "Freizuräumen" },
            { value: "Nicht vorhanden", label: "Nicht vorhanden" },
          ]}
        />
      </FormSubsection>

      <FormSubsection title="PV-Anlage & Speicher">
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
      </FormSubsection>

      <FormSubsection title="Zusatzgeräte">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField
            data={data} onChange={onChange} field="wallbox" label="Wallbox"
            options={[
              { value: "Ja", label: "Ja" },
              { value: "Nein", label: "Nein" },
              { value: "Geplant", label: "Geplant" },
            ]}
          />
          <SelectField data={data} onChange={onChange} field="elektrospeicher" label="Elektrospeicher" options={YES_NO_OPTIONS} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField data={data} onChange={onChange} field="durchlauferhitzer" label="Durchlauferhitzer" options={YES_NO_OPTIONS} />
          <SelectField data={data} onChange={onChange} field="klimageraete" label="Klimageräte" options={YES_NO_OPTIONS} />
        </div>
      </FormSubsection>

      <TextAreaField data={data} onChange={onChange} field="notes" label="Anmerkungen" placeholder="Elektroplanung Details..." />
    </div>
  );
}
