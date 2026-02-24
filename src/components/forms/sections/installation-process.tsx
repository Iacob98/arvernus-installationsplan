"use client";

import { TextField, TextAreaField } from "../field-helpers";

type Props = {
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  projectId: string;
};

export function InstallationProcessForm({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="font-medium">Phase 1 — Fundamentarbeiten</h3>
        <TextField data={data} onChange={onChange} field="phase1Title" label="Titel" placeholder="Fundamentarbeiten" />
        <TextField data={data} onChange={onChange} field="phase1Duration" label="Dauer" placeholder="(ca. 1–2 Arbeitstage)" />
        <TextAreaField data={data} onChange={onChange} field="phase1Description" label="Beschreibung" placeholder="Wir erstellen das Fundament für die Außeneinheit..." />
        <TextAreaField data={data} onChange={onChange} field="phase1Important" label="Wichtig-Hinweis" placeholder="Es gibt währenddessen keine Einschränkungen..." rows={2} />
      </div>
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="font-medium">Phase 2 — Elektrikarbeiten</h3>
        <TextField data={data} onChange={onChange} field="phase2Title" label="Titel" placeholder="Elektrikarbeiten" />
        <TextField data={data} onChange={onChange} field="phase2Duration" label="Dauer" placeholder="(i. d. R. ca. 0,5 Arbeitstage)" />
        <TextAreaField data={data} onChange={onChange} field="phase2Description" label="Beschreibung" placeholder="Wir stellen die Installation für den neuen Steuerschrank fertig..." />
        <TextAreaField data={data} onChange={onChange} field="phase2Important" label="Wichtig-Hinweis" placeholder="Ihre Stromversorgung ist hier temporär unterbrochen..." rows={2} />
      </div>
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="font-medium">Phase 3 — Installation & Inbetriebnahme</h3>
        <TextField data={data} onChange={onChange} field="phase3Title" label="Titel" placeholder="Installation & Inbetriebnahme" />
        <TextField data={data} onChange={onChange} field="phase3Duration" label="Dauer" placeholder="(ca. 2–4 Arbeitstage)" />
        <TextAreaField data={data} onChange={onChange} field="phase3Description" label="Beschreibung" placeholder="Wir demontieren Ihre alte Heizung und installieren..." />
        <TextAreaField data={data} onChange={onChange} field="phase3Important" label="Wichtig-Hinweis" placeholder="Während dieses Einsatzes gibt es eine mehrtägige Unterbrechung..." rows={2} />
      </div>
      <TextAreaField data={data} onChange={onChange} field="notes" label="Anmerkungen" placeholder="Weitere Hinweise zum Ablauf..." />
    </div>
  );
}
