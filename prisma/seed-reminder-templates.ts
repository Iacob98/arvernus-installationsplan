import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Extracted from prisma/seed.ts — seeds ONLY the offer reminder templates,
// without touching the admin user / company settings.
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

async function main() {
  for (const t of reminderDefaults) {
    await prisma.offerReminderTemplate.upsert({
      where: { step: t.step },
      update: {}, // do not overwrite if a template was edited in the UI
      create: t,
    });
    console.log(`  ✓ step ${t.step}: ${t.subject}`);
  }
  console.log(`Done — ${reminderDefaults.length} reminder templates ensured.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
