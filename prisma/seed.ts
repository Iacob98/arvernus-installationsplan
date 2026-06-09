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

  const reminderDefaults = [
    {
      step: 1,
      subject: "Dein Angebot — voller Rabatt 5% noch 5 Tage",
      htmlBody: `<p>Hallo {{firstName}},</p>
<p>bist du mit dem Angebot zufrieden?</p>
<p>Dein Angebot hat noch den vollen Rabatt von <strong>5%</strong> für <strong>5 Tage</strong> — sichere dir dein Ersparnis.</p>
<p>(Angebot im Anhang)</p>
<p>Bei Fragen melde dich gerne.</p>
<p>Viele Grüße<br>{{managerName}}</p>`,
    },
    {
      step: 2,
      subject: "Nur noch 2 Tage: 5% Rabatt sichern",
      htmlBody: `<p>Hallo {{firstName}},</p>
<p>bist du mit dem Angebot zufrieden?</p>
<p>Dein Angebot hat noch den vollen Rabatt von <strong>5%</strong> für <strong>2 Tage</strong> — sichere dir dein Ersparnis.</p>
<p>(Angebot im Anhang)</p>
<p>Bei Fragen melde dich gerne.</p>
<p>Viele Grüße<br>{{managerName}}</p>`,
    },
    {
      step: 3,
      subject: "Letzter Tag: 5% Rabatt auf dein Angebot",
      htmlBody: `<p>Hallo {{firstName}},</p>
<p>bist du mit dem Angebot zufrieden?</p>
<p>Dein Angebot hat noch den vollen Rabatt von <strong>5%</strong> für <strong>1 Tag</strong> — sichere dir dein Ersparnis.</p>
<p>(Angebot im Anhang)</p>
<p>Bei Fragen melde dich gerne.</p>
<p>Viele Grüße<br>{{managerName}}</p>`,
    },
    {
      step: 4,
      subject: "Noch 4 Tage: 3% Rabatt auf dein Angebot",
      htmlBody: `<p>Hallo {{firstName}},</p>
<p>bist du mit dem Angebot zufrieden?</p>
<p>Dein Angebot hat noch den Rabatt von <strong>3%</strong> für <strong>4 Tage</strong> — sichere dir dein Ersparnis.</p>
<p>(Angebot im Anhang)</p>
<p>Bei Fragen melde dich gerne.</p>
<p>Viele Grüße<br>{{managerName}}</p>`,
    },
  ];

  for (const t of reminderDefaults) {
    await prisma.offerReminderTemplate.upsert({
      where: { step: t.step },
      update: {},
      create: t,
    });
  }

  console.log("Seed completed:", {
    admin: admin.email,
    reminderTemplates: reminderDefaults.length,
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
