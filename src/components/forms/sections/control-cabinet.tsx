"use client";

import { TextField, TextAreaField, SelectField, FormSubsection } from "../field-helpers";

type Props = {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  projectId: string;
};

export function ControlCabinetForm({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <FormSubsection title="Steuerschrank-Paket">
        <SelectField
          data={data} onChange={onChange} field="paketVorhanden" label="Steuerschrank-Paket vorhanden"
          options={[
            { value: "Direktbelieferung", label: "Direktbelieferung" },
            { value: "Vor Ort", label: "Vor Ort" },
            { value: "Sonstiges", label: "Sonstiges" },
          ]}
        />
        <TextField data={data} onChange={onChange} field="paketBemerkung" label="Paket-Bemerkung" placeholder="z.B. V4-Paket inkl. LAN-Switch, Shelly" />
        <SelectField
          data={data} onChange={onChange} field="montagestelleFestgelegt" label="Montagestelle festgelegt"
          options={[
            { value: "Gemäß Planungsmappe / 3-D-Bildern", label: "Gemäß Planungsmappe / 3-D-Bildern" },
            { value: "Vor Ort prüfen", label: "Vor Ort prüfen" },
            { value: "Sonstiges", label: "Sonstiges" },
          ]}
        />
        <SelectField
          data={data} onChange={onChange} field="potentialausgleichschiene" label="Potentialausgleichschiene neben Steuerschrank"
          options={[
            { value: "Zu montieren", label: "Zu montieren (durch Elektriker)" },
            { value: "Vorhanden", label: "Vorhanden" },
            { value: "Nicht erforderlich", label: "Nicht erforderlich" },
          ]}
        />
      </FormSubsection>

      <FormSubsection title="Schrank-Spezifikation">
        <TextField data={data} onChange={onChange} field="cabinetType" label="Schrank-Typ" placeholder="z.B. Aufputz, Unterputz" />
        <TextField data={data} onChange={onChange} field="dimensions" label="Maße (B x H x T in cm)" placeholder="z.B. 60 x 80 x 20" />
        <TextField data={data} onChange={onChange} field="location" label="Standort" placeholder="z.B. Keller neben Heizungsraum" />
      </FormSubsection>

      <TextAreaField data={data} onChange={onChange} field="notes" label="Anmerkungen" placeholder="Weitere Details zum Steuerschrank..." />
    </div>
  );
}
