"use client";

import { TitlePageForm } from "./sections/title-page";
import { InstallationProcessForm } from "./sections/installation-process";
import { ClientPreparationForm } from "./sections/client-preparation";
import { TechnicalPlanningForm } from "./sections/technical-planning";
import { InstallationSiteForm } from "./sections/installation-site";
import { ExistingSystemForm } from "./sections/existing-system";
import { HeatingCircuitsForm } from "./sections/heating-circuits";
import { HydraulicsForm } from "./sections/hydraulics";
import { PipingForm } from "./sections/piping";
import { ElectricalPlanningForm } from "./sections/electrical-planning";
import { TariffMeterForm } from "./sections/tariff-meter";
import { PanelReplacementForm } from "./sections/panel-replacement";
import { CableRoutesForm } from "./sections/cable-routes";
import { ControlCabinetForm } from "./sections/control-cabinet";
import { AdditionalEquipmentForm } from "./sections/additional-equipment";
import { ConsentForm } from "./sections/consent";

type SectionFormProps = {
  sectionType: string;
  data: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  projectId: string;
};

const formComponents: Record<
  string,
  React.ComponentType<{
    data: Record<string, unknown>;
    onChange: (data: Record<string, unknown>) => void;
    projectId: string;
  }>
> = {
  TITLE_PAGE: TitlePageForm,
  INSTALLATION_PROCESS: InstallationProcessForm,
  CLIENT_PREPARATION: ClientPreparationForm,
  TECHNICAL_PLANNING: TechnicalPlanningForm,
  INSTALLATION_SITE: InstallationSiteForm,
  EXISTING_SYSTEM: ExistingSystemForm,
  HEATING_CIRCUITS: HeatingCircuitsForm,
  HYDRAULICS: HydraulicsForm,
  PIPING: PipingForm,
  ELECTRICAL_PLANNING: ElectricalPlanningForm,
  TARIFF_METER: TariffMeterForm,
  PANEL_REPLACEMENT: PanelReplacementForm,
  CABLE_ROUTES: CableRoutesForm,
  CONTROL_CABINET: ControlCabinetForm,
  ADDITIONAL_EQUIPMENT: AdditionalEquipmentForm,
  CONSENT: ConsentForm,
};

export function SectionForm({
  sectionType,
  data,
  onChange,
  projectId,
}: SectionFormProps) {
  const FormComponent = formComponents[sectionType];

  if (!FormComponent) {
    return <p className="text-muted-foreground">Unbekannter Abschnittstyp: {sectionType}</p>;
  }

  return <FormComponent data={data} onChange={onChange} projectId={projectId} />;
}
