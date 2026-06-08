import { PrismaClient, CatalogItemType } from "@prisma/client";

const prisma = new PrismaClient();

type SeedComponent = {
  type: CatalogItemType;
  keyword: string;
  quantity: number;
  label: string;
};

type SeedTemplate = {
  name: string;
  description: string;
  order: number;
  components: SeedComponent[];
};

const TEMPLATES: SeedTemplate[] = [
  {
    name: "Kompakt bis 120 m² · 8 kW",
    description: "Sanierung kleinerer EFH oder gut gedämmter Neubau",
    order: 1,
    components: [
      { type: "WAERMEPUMPE", keyword: "8", quantity: 1, label: "Außeneinheit 8 kW" },
      { type: "INNENGERAET", keyword: "8", quantity: 1, label: "Inneneinheit 8 kW" },
      { type: "HEIZUNGSSPEICHER", keyword: "120", quantity: 1, label: "Pufferspeicher 120 L" },
      { type: "WARMWASSERSPEICHER", keyword: "200", quantity: 1, label: "Warmwasserspeicher 200 L" },
      { type: "ANDERE", keyword: "6 Kreise", quantity: 1, label: "Heizkreisverteiler 6 Kreise" },
      { type: "ANDERE", keyword: "Heizkreispumpengruppe", quantity: 1, label: "Heizkreispumpengruppe" },
      { type: "ANDERE", keyword: "Füllpatrone", quantity: 1, label: "VDE Füllpatrone" },
      { type: "ANDERE", keyword: "Zählerschrank", quantity: 1, label: "Umbau Zählerschrank" },
    ],
  },
  {
    name: "EFH 120–160 m² · Standard",
    description: "WP 12 kW + 200 L Warmwasser + Pufferspeicher",
    order: 2,
    components: [
      { type: "WAERMEPUMPE", keyword: "12", quantity: 1, label: "Außeneinheit 12 kW" },
      { type: "INNENGERAET", keyword: "12", quantity: 1, label: "Inneneinheit 12 kW" },
      { type: "HEIZUNGSSPEICHER", keyword: "200", quantity: 1, label: "Pufferspeicher 200 L" },
      { type: "WARMWASSERSPEICHER", keyword: "200", quantity: 1, label: "Warmwasserspeicher 200 L" },
      { type: "ANDERE", keyword: "10 Kreise", quantity: 1, label: "Heizkreisverteiler 10 Kreise" },
      { type: "ANDERE", keyword: "Heizkreispumpengruppe", quantity: 1, label: "Heizkreispumpengruppe" },
      { type: "ANDERE", keyword: "Füllpatrone", quantity: 1, label: "VDE Füllpatrone" },
      { type: "ANDERE", keyword: "Zählerschrank", quantity: 1, label: "Umbau Zählerschrank" },
    ],
  },
  {
    name: "EFH 160–220 m² · Premium",
    description: "WP 16 kW + 290 L Warmwasser + großer Pufferspeicher",
    order: 3,
    components: [
      { type: "WAERMEPUMPE", keyword: "16", quantity: 1, label: "Außeneinheit 16 kW" },
      { type: "INNENGERAET", keyword: "16", quantity: 1, label: "Inneneinheit 16 kW" },
      { type: "HEIZUNGSSPEICHER", keyword: "300", quantity: 1, label: "Pufferspeicher 300 L" },
      { type: "WARMWASSERSPEICHER", keyword: "290", quantity: 1, label: "Warmwasserspeicher 290 L" },
      { type: "ANDERE", keyword: "12 Kreise", quantity: 1, label: "Heizkreisverteiler 12 Kreise" },
      { type: "ANDERE", keyword: "Heizkreispumpengruppe", quantity: 2, label: "Heizkreispumpengruppen" },
      { type: "ANDERE", keyword: "Füllpatrone", quantity: 1, label: "VDE Füllpatrone" },
      { type: "ANDERE", keyword: "Zählerschrank", quantity: 1, label: "Umbau Zählerschrank" },
    ],
  },
];

async function main() {
  console.log("Seeding offer templates…");
  for (const t of TEMPLATES) {
    const existing = await prisma.offerTemplate.findFirst({ where: { name: t.name } });
    if (existing) {
      console.log(`  → skip "${t.name}" (already exists)`);
      continue;
    }
    await prisma.offerTemplate.create({
      data: {
        name: t.name,
        description: t.description,
        order: t.order,
        active: true,
        components: { create: t.components.map((c, idx) => ({ ...c, order: idx })) },
      },
    });
    console.log(`  + ${t.name}`);
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
