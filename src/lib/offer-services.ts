/**
 * Vordefinierte Dienstleistungen (Service-Positionen) für Angebote.
 * Quelle: typisches Angebot AN-1018. Punkte 8 und 11 (reine Materialien)
 * ausgelassen — werden über den Katalog gepflegt.
 *
 * Der Manager wählt im Wizard, welche Positionen ins Angebot aufgenommen
 * werden und kann Menge + Einzelpreis vor Ort anpassen.
 */

export type ServicePreset = {
  /** Stabile ID — zum Wiedererkennen in der State */
  id: string;
  name: string;
  description: string;
  defaultPrice: number;
  defaultQuantity: number;
  /** Per default vorausgewählt? */
  defaultSelected: boolean;
};

export const SERVICE_PRESETS: ServicePreset[] = [
  {
    id: "dienstleistungspauschale",
    name: "Dienstleistungspauschale",
    description: "Auftragspauschale Service-Techniker",
    defaultPrice: 151,
    defaultQuantity: 1,
    defaultSelected: true,
  },
  {
    id: "inbetriebnahme",
    name: "Inbetriebnahme Zusatzpaket",
    description: "Luft-, Split-Luft/Wasser-Wärmepumpe",
    defaultPrice: 573,
    defaultQuantity: 1,
    defaultSelected: true,
  },
  {
    id: "anfahrtskosten",
    name: "Anfahrtskosten",
    description: "An- und Abfahrten für die benötigten Gewerke: Elektro, SHK und GaLa",
    defaultPrice: 25,
    defaultQuantity: 3,
    defaultSelected: true,
  },
  {
    id: "baustelleneinrichtung",
    name: "Baustelleneinrichtung",
    description:
      "Einrichten der Baustelle, inkl. bereitstellen von Arbeitsmitteln, inkl. hinterlassen der Baustelle in Besenrein",
    defaultPrice: 250,
    defaultQuantity: 1,
    defaultSelected: true,
  },
  {
    id: "demontage",
    name: "Demontage der Bestandsanlage",
    description:
      "Demontieren der Alt-Anlage, trennen der Bestandsleitungen zur Bestandsanlage inkl. raustragen der Alt-Anlage",
    defaultPrice: 1750,
    defaultQuantity: 1,
    defaultSelected: true,
  },
  {
    id: "entsorgung",
    name: "Entsorgung der Alt-Anlage",
    description: "Fachgerechte Entsorgung der Alt-Anlage",
    defaultPrice: 250,
    defaultQuantity: 1,
    defaultSelected: true,
  },
  {
    id: "kernbohrung",
    name: "Kernbohrung 150 mm als Hauseinführung",
    description:
      "Fachgerechte Durchführung der Kernbohrung inkl. Abdichten der Öffnung und einführen der Erdleitung",
    defaultPrice: 850,
    defaultQuantity: 1,
    defaultSelected: true,
  },
  {
    id: "installation-aussen-innen",
    name: "Installation der Außen- und Inneneinheit",
    description:
      "Installation der Außen- und Inneneinheit, inkl. Verrohren der Anlage, inkl. Anschließen der Anlage und der Inbetriebnahme",
    defaultPrice: 5898,
    defaultQuantity: 1,
    defaultSelected: true,
  },
  {
    id: "elektroarbeiten",
    name: "Elektroarbeiten für Anschluss der Wärmepumpe",
    description:
      "Herstellen eines Unterverteilers, inkl. Anschluss an Bestand-Zählerschrank",
    defaultPrice: 3000,
    defaultQuantity: 1,
    defaultSelected: true,
  },
  {
    id: "thermostatventile",
    name: "Austausch Heizkörperventile gegen voreinstellbare Thermostatventile",
    description:
      "Demontage Altventile · Lieferung und Montage neuer voreinstellbarer Ventile · Anpassung an hydraulischen Abgleich · inkl. Kleinmaterial und Abdichtung",
    defaultPrice: 0,
    defaultQuantity: 1,
    defaultSelected: false,
  },
  {
    id: "hydraulischer-abgleich",
    name: "Hydraulischer Abgleich nach Verfahren B (DIN EN 14336)",
    description:
      "Ermittlung der Heizlast je Raum · Einstellung der Volumenströme an allen Heizkörpern · Dokumentation der Einstellwerte · Protokoll zur Vorlage für Fördermittel (BEG/KfW)",
    defaultPrice: 0,
    defaultQuantity: 1,
    defaultSelected: false,
  },
  {
    id: "foerderservice",
    name: "Förderservice",
    description:
      "Komplette Antragstellung und Begleitung des KfW-458-Förderprogramms — von Antragsstellung über Verwendungsnachweis bis zur Auszahlung.",
    defaultPrice: 0,
    defaultQuantity: 1,
    defaultSelected: true,
  },
];

/** Diese Position wird im PDF separat als „inklusive" gezeigt. */
export const FOERDERSERVICE_NAME = "Förderservice";

export type ServiceLineState = {
  presetId: string;
  enabled: boolean;
  quantity: number;
  unitPrice: number;
};

export function defaultServiceLines(): ServiceLineState[] {
  return SERVICE_PRESETS.map((p) => ({
    presetId: p.id,
    enabled: p.defaultSelected,
    quantity: p.defaultQuantity,
    unitPrice: p.defaultPrice,
  }));
}
