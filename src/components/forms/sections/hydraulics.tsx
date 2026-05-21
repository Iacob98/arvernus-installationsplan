"use client";

import {
  TextField,
  NumberField,
  TextAreaField,
  SelectField,
  FormSubsection,
  YES_NO_OPTIONS,
} from "../field-helpers";

type Props = {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  projectId: string;
};

export function HydraulicsForm({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <FormSubsection title="Hydraulik">
        <SelectField
          data={data} onChange={onChange} field="indoorUnitType" label="Inneneinheit"
          options={[
            { value: "Wandgerät", label: "Wandgerät" },
            { value: "Standgerät", label: "Standgerät" },
            { value: "Kompaktgerät", label: "Kompaktgerät" },
            { value: "Buderus TP70", label: "Buderus TP70" },
            { value: "Buderus T180", label: "Buderus T180" },
          ]}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField data={data} onChange={onChange} field="bufferTankVolume" label="Pufferspeicher (Liter)" placeholder="z.B. 200" />
          <TextField data={data} onChange={onChange} field="hotWaterTankVolume" label="Warmwasserspeicher (Liter)" placeholder="z.B. 300" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField data={data} onChange={onChange} field="systemtrennung" label="Systemtrennung verbauen" options={YES_NO_OPTIONS} />
          <SelectField data={data} onChange={onChange} field="zuwegungAusreichend" label="Zuwegung und Einbringung ausreichend" options={YES_NO_OPTIONS} />
        </div>
        <SelectField data={data} onChange={onChange} field="platzHydraulik" label="Platz für verkaufte Hydraulik" options={YES_NO_OPTIONS} />
        <TextField data={data} onChange={onChange} field="hydraulikSchema" label="Hydraulikschema" placeholder="z.B. Buderus WLW 186i AR 4-7kW TP70..." />
        <TextField data={data} onChange={onChange} field="etage" label="Etage neues Heizsystem" placeholder="z.B. Keller" />
      </FormSubsection>

      <FormSubsection title="Wassermessung & Aufbereitung">
        <NumberField data={data} onChange={onChange} field="anzahlWMZ" label="Anzahl Wärmemengenzähler (WMZ)" />
        <SelectField
          data={data} onChange={onChange} field="trinkwasserEnthaertung" label="Trinkwasserenthärtung"
          options={[
            { value: "Vorgesehen", label: "Vorgesehen" },
            { value: "Nicht vorgesehen", label: "Nicht vorgesehen" },
          ]}
        />
        <SelectField
          data={data} onChange={onChange} field="entsalzungspatrone" label="Entsalzungspatrone"
          options={[
            { value: "Vollentsalzungspatrone installieren", label: "Vollentsalzungspatrone installieren" },
            { value: "Nicht vorgesehen", label: "Nicht vorgesehen" },
          ]}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField data={data} onChange={onChange} field="wzWarm" label="Wohnungswasserzähler (warm)" />
          <NumberField data={data} onChange={onChange} field="wzKalt" label="Wohnungswasserzähler (kalt)" />
        </div>
      </FormSubsection>

      <TextAreaField data={data} onChange={onChange} field="notes" label="Anmerkungen" placeholder="Hydraulik-Details..." />
    </div>
  );
}
