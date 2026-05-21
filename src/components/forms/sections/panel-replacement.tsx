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

export function PanelReplacementForm({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <FormSubsection title="Zählerschrank: Allgemein">
        <SelectField
          data={data} onChange={onChange} field="zaehlerschrankAusreichend" label="Zählerschrank ausreichend"
          options={[
            { value: "Technisch ausreichend", label: "Technisch ausreichend" },
            { value: "Erneuerung erforderlich", label: "Erneuerung erforderlich" },
            { value: "Nicht ausreichend", label: "Nicht ausreichend" },
          ]}
        />
        <SelectField
          data={data} onChange={onChange} field="bestandshauptzaehlerAusreichend" label="Bestandshauptzähler ausreichend"
          options={[
            { value: "Ausreichend (3-Punkt Befestigung)", label: "Ausreichend (3-Punkt Befestigung)" },
            { value: "Ja – eHZ", label: "Ja – eHZ" },
            { value: "Nicht ausreichend", label: "Nicht ausreichend" },
            { value: "Wechsel erforderlich", label: "Wechsel erforderlich" },
          ]}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField data={data} onChange={onChange} field="anzahlZaehler" label="Anzahl der Zähler" />
          <SelectField data={data} onChange={onChange} field="zaehlerzusammenlegung" label="Zählerzusammenlegung" options={YES_NO_OPTIONS} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField data={data} onChange={onChange} field="zaehlernummerHaupt" label="Zählernummer Hauptzähler" placeholder="z.B. 36.024.623" />
          <TextField data={data} onChange={onChange} field="zaehlernummer2" label="Zählernummer 2" placeholder="optional" />
        </div>
        <SelectField
          data={data} onChange={onChange} field="wpAnschluss" label="WP-Anschluss"
          options={[
            { value: "Modul 1 – Hausstromtarif", label: "Modul 1 – Hausstromtarif" },
            { value: "Kaskade", label: "Kaskade" },
            { value: "Sonstiges", label: "Sonstiges" },
          ]}
        />
        <CheckboxField data={data} onChange={onChange} field="replacementRequired" label="Zählerschranktausch erforderlich" />
        {Boolean(data.replacementRequired) && (
          <>
            <TextField data={data} onChange={onChange} field="newPanelLocation" label="Neuer Standort" placeholder="z.B. Keller, Flur" />
            <TextAreaField data={data} onChange={onChange} field="instructions" label="Anweisungen" placeholder="Anweisungen für den Tausch..." />
          </>
        )}
      </FormSubsection>

      <FormSubsection title="Zählerschrank: Ertüchtigung">
        <SelectField
          data={data} onChange={onChange} field="vorsicherungAusreichend" label="Zählervorsicherung ausreichend"
          options={[
            { value: "Selektiver Leitungsschutzschalter (SLS) ausreichend", label: "SLS ausreichend" },
            { value: "Nicht ausreichend", label: "Nicht ausreichend" },
          ]}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField data={data} onChange={onChange} field="bemessungsstromVorsicherung" label="Bemessungsstrom Zählervorsicherung (A)" placeholder="z.B. 35" />
          <SelectField data={data} onChange={onChange} field="ueberspannungsschutz" label="Überspannungsschutz vorhanden" options={YES_NO_OPTIONS} />
        </div>
      </FormSubsection>

      <TextAreaField data={data} onChange={onChange} field="notes" label="Anmerkungen" placeholder="Weitere Details..." />
    </div>
  );
}
