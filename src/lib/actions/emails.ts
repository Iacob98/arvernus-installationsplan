"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { emailSchema, EmailFormData } from "@/lib/validations/email";
import { addEmailJob, addImapJob } from "@/lib/queue";
import { revalidatePath } from "next/cache";
import { ClientStatus } from "@prisma/client";
import { appendSignaturePlain, buildFromHeader } from "@/lib/email/signature";

const SMTP_FROM = process.env.SMTP_FROM || process.env.SMTP_USER || "";

export async function sendEmailToClient(clientId: string, data: EmailFormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Nicht authentifiziert");

  const validated = emailSchema.parse(data);

  const [client, sender] = await Promise.all([
    db.client.findUnique({ where: { id: clientId } }),
    db.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, emailSignature: true },
    }),
  ]);
  if (!client) throw new Error("Kunde nicht gefunden");
  if (!client.email) throw new Error("Kunde hat keine E-Mail-Adresse");
  if (!sender) throw new Error("Benutzer nicht gefunden");

  const signedBody = appendSignaturePlain(validated.body, sender);
  const from = buildFromHeader(sender, SMTP_FROM);

  const emailLog = await db.emailLog.create({
    data: {
      subject: validated.subject,
      body: signedBody,
      recipients: [client.email],
      clientId,
      sentById: session.user.id,
    },
  });

  await addEmailJob({
    emailLogId: emailLog.id,
    to: [client.email],
    subject: validated.subject,
    body: signedBody,
    from,
  });

  revalidatePath(`/clients/${clientId}`);
  return emailLog;
}

export async function sendBulkEmail(
  data: EmailFormData,
  statusFilter?: ClientStatus
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Nicht authentifiziert");

  const validated = emailSchema.parse(data);

  const [clients, sender] = await Promise.all([
    db.client.findMany({
      where: {
        email: { not: "" },
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      select: { id: true, email: true },
    }),
    db.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, emailSignature: true },
    }),
  ]);

  const clientsWithEmail = clients.filter((c) => c.email);
  if (clientsWithEmail.length === 0) throw new Error("Keine Kunden mit E-Mail-Adresse gefunden");
  if (!sender) throw new Error("Benutzer nicht gefunden");

  const recipients = clientsWithEmail.map((c) => c.email!);
  const signedBody = appendSignaturePlain(validated.body, sender);
  const from = buildFromHeader(sender, SMTP_FROM);

  const emailLog = await db.emailLog.create({
    data: {
      subject: validated.subject,
      body: signedBody,
      recipients,
      sentById: session.user.id,
    },
  });

  await addEmailJob({
    emailLogId: emailLog.id,
    to: recipients,
    subject: validated.subject,
    body: signedBody,
    from,
  });

  revalidatePath("/clients");
  return emailLog;
}

export async function markInboundRead(clientId: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Nicht authentifiziert");

  await db.emailLog.updateMany({
    where: { clientId, direction: "INBOUND", read: false },
    data: { read: true },
  });
  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
}

export async function getEmailLogs(clientId?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Nicht authentifiziert");

  return db.emailLog.findMany({
    where: clientId ? { clientId } : {},
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      sentBy: { select: { name: true } },
      client: { select: { firstName: true, lastName: true } },
    },
  });
}

export async function triggerImapImport() {
  const session = await auth();
  if (!session?.user) throw new Error("Nicht authentifiziert");

  await addImapJob();
  return { success: true };
}
