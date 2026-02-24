import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash("Vr!7EbisQ#4F92", 12);
  const admin = await prisma.user.upsert({
    where: { email: "alchits@arvernus-energie.de" },
    update: { passwordHash: adminPassword },
    create: {
      email: "alchits@arvernus-energie.de",
      name: "Alchits",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  // Company settings
  await prisma.companySettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      name: "Arvernus Meisterbetrieb",
      street: "Tübinger Straße 2",
      postalCode: "10715",
      city: "Berlin",
      phone: "0123 456789",
      email: "info@arvernus-energie.de",
      website: "www.arvernus-energie.de",
      primaryColor: "#1565C0",
      secondaryColor: "#F57C00",
    },
  });

  console.log("Seed completed:", {
    admin: admin.email,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
