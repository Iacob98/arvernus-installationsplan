import { z } from "zod";

export const titlePageSchema = z.object({
  projectTitle: z.string().optional(),
  subtitle: z.string().optional(),
  additionalInfo: z.string().optional(),
});

export const installationProcessSchema = z.object({
  phase1Title: z.string().default("Fundamentarbeiten"),
  phase1Description: z.string().optional(),
  phase2Title: z.string().default("Elektroinstallation"),
  phase2Description: z.string().optional(),
  phase3Title: z.string().default("Montage & Inbetriebnahme"),
  phase3Description: z.string().optional(),
});

export const clientPreparationSchema = z.object({
  clearArea: z.boolean().default(false),
  internetAvailable: z.boolean().default(false),
  appInstalled: z.boolean().default(false),
  accessEnsured: z.boolean().default(false),
  parkingAvailable: z.boolean().default(false),
  notes: z.string().optional(),
});

export const technicalPlanningSchema = z.object({
  heatPumpModel: z.string().optional(),
  manufacturer: z.string().optional(),
  heatingCapacity: z.string().optional(),
  coolingCapacity: z.string().optional(),
  flowTemperature: z.string().optional(),
  returnTemperature: z.string().optional(),
  refrigerant: z.string().optional(),
  soundPowerLevel: z.string().optional(),
  cop: z.string().optional(),
  notes: z.string().optional(),
});

export const installationSiteSchema = z.object({
  foundationType: z.string().optional(),
  surfaceType: z.string().optional(),
  distanceToWall: z.string().optional(),
  distanceToNeighbor: z.string().optional(),
  clearanceHeight: z.string().optional(),
  requirements: z.string().optional(),
  notes: z.string().optional(),
});

export const existingSystemSchema = z.object({
  currentHeatingType: z.string().optional(),
  disposalRequired: z.boolean().default(false),
  disposalNotes: z.string().optional(),
  hasSolarPanels: z.boolean().default(false),
  solarPanelDetails: z.string().optional(),
  hotWaterSystem: z.string().optional(),
  notes: z.string().optional(),
});

export const heatingCircuitsSchema = z.object({
  totalCircuits: z.number().optional(),
  notes: z.string().optional(),
});

export const hydraulicsSchema = z.object({
  indoorUnitType: z.string().optional(),
  bufferTankVolume: z.string().optional(),
  hotWaterTankVolume: z.string().optional(),
  notes: z.string().optional(),
});

export const pipingSchema = z.object({
  wallPenetrations: z.number().default(0),
  floorPenetrations: z.number().default(0),
  pipeLength: z.string().optional(),
  insulationType: z.string().optional(),
  notes: z.string().optional(),
});

export const electricalPlanningSchema = z.object({
  mainFuseSize: z.string().optional(),
  hasPvSystem: z.boolean().default(false),
  pvSystemSize: z.string().optional(),
  inverterType: z.string().optional(),
  batteryStorage: z.boolean().default(false),
  batteryCapacity: z.string().optional(),
  notes: z.string().optional(),
});

export const tariffMeterSchema = z.object({
  tariffType: z.string().optional(),
  meterNumber: z.string().optional(),
  meterLocation: z.string().optional(),
  notes: z.string().optional(),
});

export const panelReplacementSchema = z.object({
  replacementRequired: z.boolean().default(false),
  newPanelLocation: z.string().optional(),
  instructions: z.string().optional(),
  notes: z.string().optional(),
});

export const cableRoutesSchema = z.object({
  cableLength: z.string().optional(),
  routeDescription: z.string().optional(),
  floorPlan: z.string().optional(),
  notes: z.string().optional(),
});

export const controlCabinetSchema = z.object({
  cabinetType: z.string().optional(),
  dimensions: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export const additionalEquipmentSchema = z.object({
  storageLocation: z.string().optional(),
  equipmentList: z.string().optional(),
  notes: z.string().optional(),
});

export const consentSchema = z.object({
  customerAgreed: z.boolean().default(false),
  signatureDate: z.string().optional(),
  notes: z.string().optional(),
});

export const sectionSchemas = {
  TITLE_PAGE: titlePageSchema,
  INSTALLATION_PROCESS: installationProcessSchema,
  CLIENT_PREPARATION: clientPreparationSchema,
  TECHNICAL_PLANNING: technicalPlanningSchema,
  INSTALLATION_SITE: installationSiteSchema,
  EXISTING_SYSTEM: existingSystemSchema,
  HEATING_CIRCUITS: heatingCircuitsSchema,
  HYDRAULICS: hydraulicsSchema,
  PIPING: pipingSchema,
  ELECTRICAL_PLANNING: electricalPlanningSchema,
  TARIFF_METER: tariffMeterSchema,
  PANEL_REPLACEMENT: panelReplacementSchema,
  CABLE_ROUTES: cableRoutesSchema,
  CONTROL_CABINET: controlCabinetSchema,
  ADDITIONAL_EQUIPMENT: additionalEquipmentSchema,
  CONSENT: consentSchema,
} as const;

export const SECTION_LABELS: Record<string, string> = {
  TITLE_PAGE: "Titelseite",
  INSTALLATION_PROCESS: "Installationsprozess",
  CLIENT_PREPARATION: "Kundenvorbereitung",
  TECHNICAL_PLANNING: "Technische Planung",
  INSTALLATION_SITE: "Aufstellort",
  EXISTING_SYSTEM: "Bestandsanlage",
  HEATING_CIRCUITS: "Heizkreise",
  HYDRAULICS: "Hydraulik",
  PIPING: "Rohrleitungen",
  ELECTRICAL_PLANNING: "Elektroplanung",
  TARIFF_METER: "Tarif & Zähler",
  PANEL_REPLACEMENT: "Zählerschrank",
  CABLE_ROUTES: "Kabelwege",
  CONTROL_CABINET: "Steuerschrank",
  ADDITIONAL_EQUIPMENT: "Zusatzausstattung",
  CONSENT: "Einverständnis",
};

export const SECTION_ORDER = [
  "TITLE_PAGE",
  "INSTALLATION_PROCESS",
  "CLIENT_PREPARATION",
  "TECHNICAL_PLANNING",
  "INSTALLATION_SITE",
  "EXISTING_SYSTEM",
  "HEATING_CIRCUITS",
  "HYDRAULICS",
  "PIPING",
  "ELECTRICAL_PLANNING",
  "TARIFF_METER",
  "PANEL_REPLACEMENT",
  "CABLE_ROUTES",
  "CONTROL_CABINET",
  "ADDITIONAL_EQUIPMENT",
  "CONSENT",
] as const;
