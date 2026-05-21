import { z } from "zod";

export const titlePageSchema = z.object({
  projectTitle: z.string().optional(),
  subtitle: z.string().optional(),
  additionalInfo: z.string().optional(),
});

export const deliveryNoteFileSchema = z.object({
  id: z.string(),
  fileName: z.string(),
  storagePath: z.string(),
  size: z.number(),
  mimeType: z.string(),
  uploadedAt: z.string(),
});

export const deliveryNoteSchema = z.object({
  files: z.array(deliveryNoteFileSchema).default([]),
  notes: z.string().optional(),
});

export type DeliveryNoteFile = z.infer<typeof deliveryNoteFileSchema>;

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
  // Auslegung (Thermondo)
  normHeatLoad: z.number().optional(),
  normOutdoorTemp: z.number().optional(),
  bivalencePoint: z.number().optional(),
  kwClass: z.string().optional(),
  notes: z.string().optional(),
});

export const installationSiteSchema = z.object({
  foundationType: z.string().optional(),
  surfaceType: z.string().optional(),
  distanceToWall: z.string().optional(),
  distanceToNeighbor: z.string().optional(),
  clearanceHeight: z.string().optional(),
  requirements: z.string().optional(),
  // Aufstellort WP
  aushubrestEntsorgung: z.string().optional(),
  schutzbereichPropan: z.string().optional(),
  anfahrschutz: z.string().optional(),
  abdeckhaubeBuderus: z.string().optional(),
  // Hauseinführung
  hauseinfuehrungArt: z.string().optional(),
  hauseinfuehrungEntfernung: z.number().optional(),
  hauseinfuehrungLeitungsfuehrung: z.string().optional(),
  hauseinfuehrungOberflaeche: z.string().optional(),
  wellrohrLaenge: z.number().optional(),
  // Vorschriften & Logistik
  taLaermEingehalten: z.string().optional(),
  baurechtEingehalten: z.string().optional(),
  tragehilfeBenoetigt: z.string().optional(),
  geruestHebebuehne: z.string().optional(),
  notes: z.string().optional(),
});

export const existingSystemSchema = z.object({
  currentHeatingType: z.string().optional(),
  disposalRequired: z.boolean().default(false),
  disposalNotes: z.string().optional(),
  hasSolarPanels: z.boolean().default(false),
  solarPanelDetails: z.string().optional(),
  hotWaterSystem: z.string().optional(),
  // Bestandsanlage (Thermondo)
  typenbezeichnungBestand: z.string().optional(),
  inbetriebnahmeJahr: z.number().optional(),
  // Gas-Daten
  ruckbauGasleitung: z.string().optional(),
  gaszaehlerNummer: z.string().optional(),
  gaszaehlerStandM3: z.number().optional(),
  // WW & Hydraulik-Bestand
  warmwasserUeberHeizung: z.string().optional(),
  zirkulationsleitung: z.string().optional(),
  druckminderer: z.string().optional(),
  kondensatpumpe: z.string().optional(),
  notes: z.string().optional(),
});

export const heatingCircuitsSchema = z.object({
  totalCircuits: z.number().optional(),
  circuitsHeizkoerper: z.number().optional(),
  circuitsFussboden: z.number().optional(),
  rohrsystem: z.string().optional(),
  anzahlHeizkoerper: z.number().optional(),
  anzahlHeizschlaufen: z.number().optional(),
  anzahlZuTauschen: z.number().optional(),
  notes: z.string().optional(),
});

export const hydraulicsSchema = z.object({
  indoorUnitType: z.string().optional(),
  bufferTankVolume: z.string().optional(),
  hotWaterTankVolume: z.string().optional(),
  // Hydraulik (Thermondo)
  systemtrennung: z.string().optional(),
  zuwegungAusreichend: z.string().optional(),
  platzHydraulik: z.string().optional(),
  hydraulikSchema: z.string().optional(),
  etage: z.string().optional(),
  // Wassermessung
  anzahlWMZ: z.number().optional(),
  trinkwasserEnthaertung: z.string().optional(),
  entsalzungspatrone: z.string().optional(),
  wzWarm: z.number().optional(),
  wzKalt: z.number().optional(),
  notes: z.string().optional(),
});

export const pipingSchema = z.object({
  wallPenetrations: z.number().default(0),
  floorPenetrations: z.number().default(0),
  pipeLength: z.string().optional(),
  insulationType: z.string().optional(),
  rohrlaengeHEzuInnen: z.number().optional(),
  zusaetzlicheVerrohrung: z.number().optional(),
  notes: z.string().optional(),
});

export const electricalPlanningSchema = z.object({
  mainFuseSize: z.string().optional(),
  hasPvSystem: z.boolean().default(false),
  pvSystemSize: z.string().optional(),
  inverterType: z.string().optional(),
  batteryStorage: z.boolean().default(false),
  batteryCapacity: z.string().optional(),
  // HAK
  hakAusreichend: z.string().optional(),
  hakAufstellort: z.string().optional(),
  hakPotentialausgleich: z.string().optional(),
  // Potentialausgleich
  potentialausgleichAusreichend: z.string().optional(),
  potentialausgleichAusfuehrung: z.string().optional(),
  tiefenerderErforderlich: z.string().optional(),
  // HEMS
  hemsInternetVerbindung: z.string().optional(),
  hemsLanBuchseFrei: z.string().optional(),
  hemsSteckdoseRouter: z.string().optional(),
  // Zusatzgeräte
  wallbox: z.string().optional(),
  elektrospeicher: z.string().optional(),
  durchlauferhitzer: z.string().optional(),
  klimageraete: z.string().optional(),
  notes: z.string().optional(),
});

export const tariffMeterSchema = z.object({
  tariffType: z.string().optional(),
  meterNumber: z.string().optional(),
  meterLocation: z.string().optional(),
  netzbetreiber: z.string().optional(),
  netzbetreiberBemerkung: z.string().optional(),
  tsgAusfuehrung: z.string().optional(),
  notes: z.string().optional(),
});

export const panelReplacementSchema = z.object({
  replacementRequired: z.boolean().default(false),
  newPanelLocation: z.string().optional(),
  instructions: z.string().optional(),
  // Allgemein
  zaehlerschrankAusreichend: z.string().optional(),
  bestandshauptzaehlerAusreichend: z.string().optional(),
  anzahlZaehler: z.number().optional(),
  zaehlernummerHaupt: z.string().optional(),
  zaehlernummer2: z.string().optional(),
  zaehlerzusammenlegung: z.string().optional(),
  wpAnschluss: z.string().optional(),
  // Ertüchtigung
  vorsicherungAusreichend: z.string().optional(),
  bemessungsstromVorsicherung: z.number().optional(),
  ueberspannungsschutz: z.string().optional(),
  notes: z.string().optional(),
});

export const cableRoutesSchema = z.object({
  cableLength: z.string().optional(),
  routeDescription: z.string().optional(),
  floorPlan: z.string().optional(),
  // Strecke A: HAK ↔ ZS
  hakZsErneuerung: z.string().optional(),
  hakZsBemerkung: z.string().optional(),
  // Strecke B: ZS ↔ Steuerschrank
  zsScLaenge: z.number().optional(),
  zsScWanddurchbrueche: z.number().optional(),
  zsScDeckendurchbrueche: z.number().optional(),
  // Strecke C: Steuerschrank ↔ WP
  scWpLaenge: z.number().optional(),
  scBackupHeaterLaenge: z.number().optional(),
  verlegungBadezimmer: z.string().optional(),
  heizungsdemontageElektro: z.string().optional(),
  notes: z.string().optional(),
});

export const controlCabinetSchema = z.object({
  cabinetType: z.string().optional(),
  dimensions: z.string().optional(),
  location: z.string().optional(),
  // Steuerschrank-Paket
  paketVorhanden: z.string().optional(),
  paketBemerkung: z.string().optional(),
  montagestelleFestgelegt: z.string().optional(),
  potentialausgleichschiene: z.string().optional(),
  notes: z.string().optional(),
});

export const additionalEquipmentSchema = z.object({
  storageLocation: z.string().optional(),
  equipmentList: z.string().optional(),
  oeltankentsorgungElektro: z.string().optional(),
  geruestNotwendigElektro: z.string().optional(),
  sondermaterialElektroVorhanden: z.string().optional(),
  sondermaterialElektroDetails: z.string().optional(),
  notes: z.string().optional(),
});

export const consentSchema = z.object({
  customerAgreed: z.boolean().default(false),
  signatureDate: z.string().optional(),
  notes: z.string().optional(),
});

export const sectionSchemas = {
  TITLE_PAGE: titlePageSchema,
  DELIVERY_NOTE: deliveryNoteSchema,
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
  DELIVERY_NOTE: "Lieferschein",
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
  "DELIVERY_NOTE",
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
