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

export function InstallationSiteForm({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <FormSubsection title="Aufstellort Wärmepumpe">
        <SelectField
          data={data} onChange={onChange} field="foundationType" label="Fundamentart"
          options={[
            { value: "Klassik", label: "Klassik" },
            { value: "Betonfundament", label: "Betonfundament" },
            { value: "Kiesbett", label: "Kiesbett" },
            { value: "Pflastersteine", label: "Pflastersteine" },
            { value: "Vorhandenes Fundament", label: "Vorhandenes Fundament" },
          ]}
        />
        <SelectField
          data={data} onChange={onChange} field="surfaceType" label="Untergrund"
          options={[
            { value: "Rasen", label: "Rasen" },
            { value: "Beton", label: "Beton" },
            { value: "Kies", label: "Kies" },
            { value: "Pflaster", label: "Pflaster" },
          ]}
        />
        <SelectField
          data={data} onChange={onChange} field="aushubrestEntsorgung" label="Aushubreste"
          options={[
            { value: "Entsorgen durch Arvernus", label: "Entsorgen durch Arvernus" },
            { value: "Verbleibt vor Ort", label: "Verbleibt vor Ort" },
            { value: "Durch Kunde", label: "Durch Kunde" },
          ]}
        />
        <SelectField
          data={data} onChange={onChange} field="schutzbereichPropan" label="Schutzbereichherstellung für Propan (Rasenkantenstein)"
          options={[
            { value: "Ja", label: "Ja" },
            { value: "Nein", label: "Nein" },
            { value: "Nicht relevant", label: "Nicht relevant" },
          ]}
        />
        <SelectField
          data={data} onChange={onChange} field="anfahrschutz" label="Anfahrschutz notwendig"
          options={[
            { value: "Nicht notwendig", label: "Nicht notwendig" },
            { value: "Notwendig", label: "Notwendig" },
            { value: "Vorhanden", label: "Vorhanden" },
          ]}
        />
        <SelectField
          data={data} onChange={onChange} field="abdeckhaubeBuderus" label="Abdeckhaube Buderus"
          options={[
            { value: "Verbauen", label: "Verbauen" },
            { value: "Nicht verbauen", label: "Nicht verbauen" },
          ]}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField data={data} onChange={onChange} field="distanceToWall" label="Abstand zur Hauswand (cm)" placeholder="z.B. 30" />
          <TextField data={data} onChange={onChange} field="distanceToNeighbor" label="Abstand zum Nachbarn (m)" placeholder="z.B. 3" />
        </div>
        <TextField data={data} onChange={onChange} field="clearanceHeight" label="Lichte Höhe (cm)" placeholder="z.B. 200" />
      </FormSubsection>

      <FormSubsection title="Hauseinführung">
        <SelectField
          data={data} onChange={onChange} field="hauseinfuehrungArt" label="Hauseinführung"
          options={[
            { value: "Unterirdisch", label: "Unterirdisch" },
            { value: "Oberirdisch", label: "Oberirdisch" },
          ]}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberField data={data} onChange={onChange} field="hauseinfuehrungEntfernung" label="Entfernung zu Außeneinheit (m)" placeholder="z.B. 1.0" />
          <NumberField data={data} onChange={onChange} field="wellrohrLaenge" label="Länge benötigtes Wellrohr (m)" placeholder="z.B. 5.0" />
        </div>
        <SelectField
          data={data} onChange={onChange} field="hauseinfuehrungLeitungsfuehrung" label="Leitungsführung"
          options={[
            { value: "Unterirdisch mit Schachtung", label: "Unterirdisch mit Schachtung" },
            { value: "Direktverlegung", label: "Direktverlegung" },
            { value: "Sonstiges", label: "Sonstiges" },
          ]}
        />
        <SelectField
          data={data} onChange={onChange} field="hauseinfuehrungOberflaeche" label="Oberfläche"
          options={[
            { value: "Versiegelt", label: "Versiegelt" },
            { value: "Unversiegelt", label: "Unversiegelt" },
          ]}
        />
      </FormSubsection>

      <FormSubsection title="Vorschriften & Logistik">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField data={data} onChange={onChange} field="taLaermEingehalten" label="TA-Lärm eingehalten" options={YES_NO_OPTIONS} />
          <SelectField data={data} onChange={onChange} field="baurechtEingehalten" label="Baurecht eingehalten" options={YES_NO_OPTIONS} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SelectField data={data} onChange={onChange} field="tragehilfeBenoetigt" label="Tragehilfe benötigt" options={YES_NO_OPTIONS} />
          <SelectField
            data={data} onChange={onChange} field="geruestHebebuehne" label="Gerüst / Hebebühne für Heizungsinstallation"
            options={[
              { value: "Nicht notwendig", label: "Nicht notwendig" },
              { value: "Gerüst", label: "Gerüst" },
              { value: "Hebebühne", label: "Hebebühne" },
            ]}
          />
        </div>
      </FormSubsection>

      <TextAreaField data={data} onChange={onChange} field="requirements" label="Besondere Anforderungen" placeholder="Anforderungen an den Aufstellort..." />
      <TextAreaField data={data} onChange={onChange} field="notes" label="Anmerkungen" placeholder="Weitere Notizen..." />
    </div>
  );
}
