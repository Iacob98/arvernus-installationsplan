import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@arvernus.de" },
    update: {},
    create: {
      email: "admin@arvernus.de",
      name: "Admin User",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });

  // Create technician user
  const techPassword = await bcrypt.hash("tech123", 12);
  const technician = await prisma.user.upsert({
    where: { email: "techniker@arvernus.de" },
    update: {},
    create: {
      email: "techniker@arvernus.de",
      name: "Max Mustermann",
      passwordHash: techPassword,
      role: "TECHNICIAN",
    },
  });

  // Create sample clients
  const client1 = await prisma.client.upsert({
    where: { customerNumber: "KD-2024-001" },
    update: {},
    create: {
      customerNumber: "KD-2024-001",
      salutation: "Herr",
      firstName: "Thomas",
      lastName: "Schmidt",
      email: "t.schmidt@example.de",
      phone: "+49 170 1234567",
      street: "Musterstraße",
      houseNumber: "42",
      postalCode: "10115",
      city: "Berlin",
    },
  });

  const client2 = await prisma.client.upsert({
    where: { customerNumber: "KD-2024-002" },
    update: {},
    create: {
      customerNumber: "KD-2024-002",
      salutation: "Frau",
      firstName: "Anna",
      lastName: "Müller",
      email: "a.mueller@example.de",
      phone: "+49 171 9876543",
      street: "Berliner Allee",
      houseNumber: "15a",
      postalCode: "40212",
      city: "Düsseldorf",
    },
  });

  // Create sample project
  const project = await prisma.project.upsert({
    where: { projectNumber: "PRJ-2024-001" },
    update: {},
    create: {
      projectNumber: "PRJ-2024-001",
      title: "Wärmepumpe Installation Schmidt",
      status: "IN_PROGRESS",
      street: "Musterstraße",
      houseNumber: "42",
      postalCode: "10115",
      city: "Berlin",
      clientId: client1.id,
      createdById: admin.id,
      installationDate: new Date("2024-04-15"),
    },
  });

  // Create all 16 sections for the project
  const sectionTypes = [
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

  for (let i = 0; i < sectionTypes.length; i++) {
    await prisma.projectSection.upsert({
      where: {
        projectId_type: {
          projectId: project.id,
          type: sectionTypes[i],
        },
      },
      update: {},
      create: {
        type: sectionTypes[i],
        order: i + 1,
        projectId: project.id,
        data: {},
        completed: false,
      },
    });
  }

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
    users: [admin.email, technician.email],
    clients: [client1.customerNumber, client2.customerNumber],
    project: project.projectNumber,
    sections: sectionTypes.length,
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
