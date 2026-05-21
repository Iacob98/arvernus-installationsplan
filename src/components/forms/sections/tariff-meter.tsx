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
        data={data} onChange={onChange} field="tariffType" label="Stromtarif für Wärmepumpe nach §14a"
        options={[
          { value: "Modul 1 (Hausstrom)", label: "Modul 1 (Hausstrom)" },
          { value: "Modul 2", label: "Modul 2" },
          { value: "Wärmepumpentarif", label: "Wärmepumpentarif" },
          { value: "Standardtarif", label: "Standardtarif" },
        ]}
      />
      <TextField data={data} onChange={onChange} field="netzbetreiber" label="Netzbetreiber" placeholder="z.B. Stromnetz Berlin GmbH" />
      <TextField data={data} onChange={onChange} field="netzbetreiberBemerkung" label="Netzbetreiber – Bemerkung" placeholder="Anmerkung" />
      <SelectField
        data={data} onChange={onChange} field="tsgAusfuehrung" label="Ausführung Tarifschaltgerät (TSG)"
        options={[
          { value: "TSG nicht notwendig, intelligentes Messsystem vorbereiten", label: "TSG nicht notwendig, intelligentes Messsystem vorbereiten" },
          { value: "Reiheneinbaugerät im RFZ / zRFZ", label: "Reiheneinbaugerät im RFZ / zRFZ" },
          { value: "TSG erforderlich", label: "TSG erforderlich" },
        ]}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField data={data} onChange={onChange} field="meterNumber" label="Zählernummer" placeholder="Zählernummer eingeben" />
        <TextField data={data} onChange={onChange} field="meterLocation" label="Zählerstandort" placeholder="z.B. Keller" />
      </div>
      <TextAreaField data={data} onChange={onChange} field="notes" label="Anmerkungen" placeholder="Weitere Informationen..." />
    </div>
  );
}
