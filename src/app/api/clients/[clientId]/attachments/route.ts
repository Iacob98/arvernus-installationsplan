import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadFile } from "@/lib/storage";

async function assertCanAccessClient(clientId: string) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized", status: 401 as const };
  }

  const client = await db.client.findUnique({
    where: { id: clientId },
    select: { id: true, assignedToId: true },
  });
  if (!client) return { error: "Not found", status: 404 as const };

  if (session.user.role !== "ADMIN" && client.assignedToId !== session.user.id) {
    return { error: "Forbidden", status: 403 as const };
  }

  return { session };
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const access = await assertCanAccessClient(clientId);
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const timestamp = Date.now();
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
  const baseName = `${timestamp}-${Math.random().toString(36).slice(2, 8)}`;
  const storagePath = `client-attachments/${clientId}/${baseName}.${ext}`;

  await uploadFile(storagePath, buffer, file.type || "application/octet-stream");

  const attachment = await db.clientAttachment.create({
    data: {
      fileName: file.name,
      storagePath,
      mimeType: file.type || "application/octet-stream",
      size: buffer.length,
      clientId,
      uploadedById: access.session.user.id,
    },
    include: { uploadedBy: { select: { name: true } } },
  });

  return NextResponse.json(attachment);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;
  const access = await assertCanAccessClient(clientId);
  if ("error" in access) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  const attachments = await db.clientAttachment.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    include: { uploadedBy: { select: { name: true } } },
  });

  return NextResponse.json(attachments);
}
