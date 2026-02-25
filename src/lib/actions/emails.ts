"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { emailSchema, EmailFormData } from "@/lib/validations/email";
import { addEmailJob, addImapJob } from "@/lib/queue";
import { revalidatePath } from "next/cache";
import { ClientStatus } from "@prisma/client";

export async function sendEmailToClient(clientId: string, data: EmailFormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Nicht authentifiziert");

  const validated = emailSchema.parse(data);

  const client = await db.client.findUnique({ where: { id: clientId } });
  if (!client) throw new Error("Kunde nicht gefunden");
  if (!client.email) throw new Error("Kunde hat keine E-Mail-Adresse");

  const emailLog = await db.emailLog.create({
    data: {
      subject: validated.subject,
      body: validated.body,
      recipients: [client.email],
      clientId,
      sentById: session.user.id,
    },
  });

  await addEmailJob({
    emailLogId: emailLog.id,
    to: [client.email],
    subject: validated.subject,
    body: validated.body,
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

  const clients = await db.client.findMany({
    where: {
      email: { not: "" },
      ...(statusFilter ? { status: statusFilter } : {}),
    },
    select: { id: true, email: true },
  });

  const clientsWithEmail = clients.filter((c) => c.email);
  if (clientsWithEmail.length === 0) throw new Error("Keine Kunden mit E-Mail-Adresse gefunden");

  const recipients = clientsWithEmail.map((c) => c.email!);

  const emailLog = await db.emailLog.create({
    data: {
      subject: validated.subject,
      body: validated.body,
      recipients,
      sentById: session.user.id,
    },
  });

  await addEmailJob({
    emailLogId: emailLog.id,
    to: recipients,
    subject: validated.subject,
    body: validated.body,
  });

  revalidatePath("/clients");
  return emailLog;
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
