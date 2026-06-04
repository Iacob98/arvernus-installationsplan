import { PrismaClient, CatalogItemType, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

type VariantSeed = {
  name: string;
  description: string;
  price: number;
  technicalData: { key: string; value: string }[];
};

type ItemSeed = {
  name: string;
  type: CatalogItemType;
  manufacturer?: string;
  description?: string;
  variants: VariantSeed[];
};

const CATALOG: ItemSeed[] = [
  {
    name: "Bosch Compress Außeneinheit",
    type: "WAERMEPUMPE",
    manufacturer: "Bosch",
    description:
      "Luft-Wasser-Wärmepumpe der Compress-6800i-AW-Reihe. Vollelektrisch, monovalent, R-290 Kältemittel.",
    variants: [
      {
        name: "AW 8 OR-S",
        description:
          "Nennleistung 8 kW. Eignet sich für gut gedämmte Einfamilienhäuser bis ca. 160 m².",
        price: 9800,
        technicalData: [
          { key: "Nennleistung", value: "8 kW" },
          { key: "Kältemittel", value: "R-290" },
          { key: "Schalldruckpegel", value: "32 dB(A) @ 5 m" },
        ],
      },
      {
        name: "AW 12 OR-S",
        description:
          "Nennleistung 12 kW für mittelgroße Einfamilienhäuser und Sanierungen.",
        price: 11200,
        technicalData: [
          { key: "Nennleistung", value: "12 kW" },
          { key: "Kältemittel", value: "R-290" },
          { key: "Schalldruckpegel", value: "34 dB(A) @ 5 m" },
        ],
      },
      {
        name: "AW 16 OR-S",
        description:
          "Nennleistung 16 kW. Geeignet für größere Häuser, Mehrfamilienhäuser oder Altbauten mit höherem Wärmebedarf.",
        price: 12800,
        technicalData: [
          { key: "Nennleistung", value: "16 kW" },
          { key: "Kältemittel", value: "R-290" },
          { key: "Schalldruckpegel", value: "36 dB(A) @ 5 m" },
        ],
      },
    ],
  },
  {
    name: "Bosch Compress Inneneinheit",
    type: "INNENGERAET",
    manufacturer: "Bosch",
    description:
      "Hydromodul / Inneneinheit zur Bosch Compress Außeneinheit. Mit MM100-Steuerung und integriertem Heizstab.",
    variants: [
      {
        name: "AW 8 E",
        description: "Passend zur AW 8 OR-S Außeneinheit. Heizstab 9 kW.",
        price: 2900,
        technicalData: [
          { key: "Heizstab", value: "9 kW" },
          { key: "Steuerung", value: "MM100" },
        ],
      },
      {
        name: "AW 12 E",
        description: "Passend zur AW 12 OR-S Außeneinheit. Heizstab 9 kW.",
        price: 3100,
        technicalData: [
          { key: "Heizstab", value: "9 kW" },
          { key: "Steuerung", value: "MM100" },
        ],
      },
      {
        name: "AW 16 E",
        description: "Passend zur AW 16 OR-S Außeneinheit. Heizstab 9 kW.",
        price: 3300,
        technicalData: [
          { key: "Heizstab", value: "9 kW" },
          { key: "Steuerung", value: "MM100" },
        ],
      },
    ],
  },
  {
    name: "Junkers Bosch Pufferspeicher Stora",
    type: "HEIZUNGSSPEICHER",
    manufacturer: "Bosch",
    description:
      "Pufferspeicher für Wärmepumpen mit Wärmeschutz aus PU-Hartschaum.",
    variants: [
      {
        name: "BH 120-5 1 A, silber",
        description: "120 Liter Volumen. Kompakt für kleinere Anlagen.",
        price: 1100,
        technicalData: [
          { key: "Nennvolumen", value: "120 Liter" },
          { key: "Durchmesser", value: "500 mm" },
          { key: "Höhe", value: "1100 mm" },
        ],
      },
      {
        name: "BH 200-5 1 A, silber",
        description: "200 Liter Volumen. Standardgröße für Einfamilienhäuser.",
        price: 1450,
        technicalData: [
          { key: "Nennvolumen", value: "200 Liter" },
          { key: "Durchmesser", value: "600 mm" },
          { key: "Höhe", value: "1550 mm" },
          { key: "Gewicht", value: "79 kg" },
        ],
      },
      {
        name: "BH 300-5 K1 B, silber",
        description: "300 Liter Volumen mit PS-Mantel. Für größere Anlagen.",
        price: 1850,
        technicalData: [
          { key: "Nennvolumen", value: "300 Liter" },
          { key: "Durchmesser", value: "650 mm" },
          { key: "Höhe", value: "1850 mm" },
        ],
      },
    ],
  },
  {
    name: "Junkers Bosch Warmwasserspeicher Stora",
    type: "WARMWASSERSPEICHER",
    manufacturer: "Bosch",
    description:
      "Wärmepumpenspeicher Stora für Warmwasserbereitung. Anschlussfertig.",
    variants: [
      {
        name: "WH 200 LP 1 B, silber",
        description: "200 Liter Volumen.",
        price: 1700,
        technicalData: [
          { key: "Nennvolumen", value: "200 Liter" },
          { key: "Durchmesser", value: "600 mm" },
          { key: "Höhe", value: "1100 mm" },
        ],
      },
      {
        name: "WH 290 LP 1 B, silber",
        description: "290 Liter Volumen. Inklusive Anschlussfertigkeit.",
        price: 2050,
        technicalData: [
          { key: "Nennvolumen", value: "290 Liter" },
          { key: "Durchmesser", value: "700 mm" },
          { key: "Höhe", value: "1294 mm" },
          { key: "Gewicht", value: "128 kg" },
        ],
      },
    ],
  },
  {
    name: "Geregelte Heizkreispumpengruppe",
    type: "ANDERE",
    description: "Mit MM100-Steuerung. Für die Regelung eines Heizkreises.",
    variants: [
      {
        name: "MM100 Standard",
        description: "Standardausführung der Heizkreispumpengruppe.",
        price: 480,
        technicalData: [
          { key: "Steuerung", value: "MM100" },
          { key: "Max. Vorlauftemperatur", value: "70 °C" },
        ],
      },
    ],
  },
  {
    name: "Heizkreisverteiler",
    type: "ANDERE",
    description: "Edelstahlverteiler mit Topmeter zur stufenlosen Einstellung.",
    variants: [
      {
        name: "6 Kreise",
        description: "Für sechs Heizkreise.",
        price: 240,
        technicalData: [
          { key: "Anzahl Kreise", value: "6" },
          { key: "Abgänge", value: "3/4″ Eurokonus" },
        ],
      },
      {
        name: "10 Kreise",
        description: "Für zehn Heizkreise.",
        price: 320,
        technicalData: [
          { key: "Anzahl Kreise", value: "10" },
          { key: "Abgänge", value: "3/4″ Eurokonus" },
          { key: "Max. Betriebsdruck", value: "6 bar" },
        ],
      },
      {
        name: "12 Kreise",
        description: "Für zwölf Heizkreise.",
        price: 380,
        technicalData: [
          { key: "Anzahl Kreise", value: "12" },
          { key: "Abgänge", value: "3/4″ Eurokonus" },
        ],
      },
    ],
  },
  {
    name: "VDE Füllpatrone VE Wasser",
    type: "ANDERE",
    description:
      "Zur normgerechten Befüllung und Entgasung der Heizungsanlage. Inkl. Übergabe an installierende Fachkraft.",
    variants: [
      {
        name: "Standard",
        description: "Standard-VDE-Füllpatrone.",
        price: 150,
        technicalData: [],
      },
    ],
  },
  {
    name: "Umbau Zählerschrank",
    type: "ANDERE",
    description:
      "Anpassung und Erweiterung des Zählerschranks für den Anschluss der Wärmepumpe.",
    variants: [
      {
        name: "Standard",
        description: "Inkl. FI Typ B und erforderlicher Absicherung.",
        price: 1100,
        technicalData: [],
      },
    ],
  },
];

async function main() {
  console.log("Seeding test catalog…");

  for (const item of CATALOG) {
    const existing = await prisma.catalogItem.findFirst({
      where: { name: item.name },
    });

    if (existing) {
      console.log(`  → skip "${item.name}" (already exists)`);
      continue;
    }

    await prisma.catalogItem.create({
      data: {
        name: item.name,
        type: item.type,
        manufacturer: item.manufacturer ?? null,
        description: item.description ?? null,
        active: true,
        order: 0,
        variants: {
          create: item.variants.map((v, idx) => ({
            name: v.name,
            description: v.description,
            price: new Prisma.Decimal(v.price),
            technicalData: v.technicalData,
            active: true,
            order: idx,
          })),
        },
      },
    });
    console.log(`  + ${item.name} (${item.variants.length} Varianten)`);
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
