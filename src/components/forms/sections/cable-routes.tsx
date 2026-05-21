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

export function CableRoutesForm({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <FormSubsection title="Strecke A: HAK ↔ Zählerschrank">
        <SelectField
          data={data} onChange={onChange} field="hakZsErneuerung" label="Hauptleitung HAK → ZS: Erneuerung"
          options={[
            { value: "Notwendig", label: "Notwendig" },
            { value: "Nicht notwendig", label: "Nicht notwendig" },
          ]}
        />
        <TextField data={data} onChange={onChange} field="hakZsBemerkung" label="Bemerkung" placeholder="z.B. Keine Wand-/Deckendurchbrüche" />
      </FormSubsection>

      <FormSubsection title="Strecke B: Zählerschrank ↔ Steuerschrank">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <NumberField data={data} onChange={onChange} field="zsScLaenge" label="Leitungslänge (m)" placeholder="z.B. 13" />
          <NumberField data={data} onChange={onChange} field="zsScWanddurchbrueche" label="Wanddurchbrüche" min={0} />
          <NumberField data={data} onChange={onChange} field="zsScDeckendurchbrueche" label="Deckendurchbrüche" min={0} />
        </div>
      </FormSubsection>

      <FormSubsection title="Strecke C: Steuerschrank ↔ Wärmepumpe">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField data={data} onChange={onChange} field="scWpLaenge" label="Leitungslänge Steuerschrank → WP/Inneneinheit (m)" placeholder="z.B. 7" />
          <NumberField data={data} onChange={onChange} field="scBackupHeaterLaenge" label="Leitungslänge Steuerschrank → Backup Heater (m)" placeholder="z.B. 7" />
        </div>
        <SelectField data={data} onChange={onChange} field="verlegungBadezimmer" label="Leitungsverlegung durch ein Badezimmer" options={YES_NO_OPTIONS} />
        <SelectField data={data} onChange={onChange} field="heizungsdemontageElektro" label="Heizungsdemontage für Elektroinstallation notwendig" options={YES_NO_OPTIONS} />
      </FormSubsection>

      <TextField data={data} onChange={onChange} field="cableLength" label="Gesamtkabellänge (m)" placeholder="z.B. 25 (optional, Übersicht)" />
      <TextAreaField data={data} onChange={onChange} field="routeDescription" label="Kabelweg-Beschreibung" placeholder="Beschreibung des Kabelwegs..." rows={4} />
      <TextAreaField data={data} onChange={onChange} field="floorPlan" label="Grundriss-Notizen" placeholder="Notizen zum Grundriss und Farbmarkierung..." />
      <TextAreaField data={data} onChange={onChange} field="notes" label="Anmerkungen" placeholder="Weitere Details..." />
    </div>
  );
}
