"use client";

import { TextField, TextAreaField, SelectField } from "../field-helpers";

type Props = {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  projectId: string;
};

export function InstallationSiteForm({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <SelectField
        data={data} onChange={onChange} field="foundationType" label="Fundamenttyp"
        options={[
          { value: "concrete", label: "Betonfundament" },
          { value: "gravel", label: "Kiesbett" },
          { value: "paving", label: "Pflastersteine" },
          { value: "existing", label: "Vorhandenes Fundament" },
        ]}
      />
      <SelectField
        data={data} onChange={onChange} field="surfaceType" label="Untergrund"
        options={[
          { value: "lawn", label: "Rasen" },
          { value: "concrete", label: "Beton" },
          { value: "gravel", label: "Kies" },
          { value: "paving", label: "Pflaster" },
        ]}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField data={data} onChange={onChange} field="distanceToWall" label="Abstand zur Hauswand (cm)" placeholder="z.B. 30" />
        <TextField data={data} onChange={onChange} field="distanceToNeighbor" label="Abstand zum Nachbarn (m)" placeholder="z.B. 3" />
      </div>
      <TextField data={data} onChange={onChange} field="clearanceHeight" label="Lichte Höhe (cm)" placeholder="z.B. 200" />
      <TextAreaField data={data} onChange={onChange} field="requirements" label="Besondere Anforderungen" placeholder="Anforderungen an den Aufstellort..." />
      <TextAreaField data={data} onChange={onChange} field="notes" label="Anmerkungen" placeholder="Weitere Notizen..." />
    </div>
  );
}
