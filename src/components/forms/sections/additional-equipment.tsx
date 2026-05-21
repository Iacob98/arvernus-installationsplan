"use client";

import {
  TextField,
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

export function AdditionalEquipmentForm({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      <FormSubsection title="Lagerung & Liste">
        <TextField data={data} onChange={onChange} field="storageLocation" label="Lagerort" placeholder="z.B. Garage, Keller" />
        <TextAreaField data={data} onChange={onChange} field="equipmentList" label="Ausstattungsliste" placeholder="Liste der zusätzlichen Geräte und Materialien..." rows={4} />
      </FormSubsection>

      <FormSubsection title="Voraussetzungen für Elektroinstallation">
        <SelectField
          data={data} onChange={onChange} field="oeltankentsorgungElektro" label="Öltankentsorgung für Elektroinstallation"
          options={[
            { value: "Notwendig vor Elektroinstallation", label: "Notwendig vor Elektroinstallation" },
            { value: "Nicht notwendig vor Elektroinstallation", label: "Nicht notwendig vor Elektroinstallation" },
          ]}
        />
        <SelectField data={data} onChange={onChange} field="geruestNotwendigElektro" label="Gerüst notwendig für Elektroinstallation" options={YES_NO_OPTIONS} />
        <SelectField data={data} onChange={onChange} field="sondermaterialElektroVorhanden" label="Sondermaterial Elektro erforderlich" options={YES_NO_OPTIONS} />
        {Boolean(data.sondermaterialElektroVorhanden === "Ja") && (
          <TextField data={data} onChange={onChange} field="sondermaterialElektroDetails" label="Sondermaterial – Details" placeholder="z.B. Spezielle Kabelschutzrohre" />
        )}
      </FormSubsection>

      <TextAreaField data={data} onChange={onChange} field="notes" label="Anmerkungen" placeholder="Weitere Details..." />
    </div>
  );
}
