import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadFile, deleteFile } from "@/lib/storage";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const sectionId = formData.get("sectionId") as string | null;

  if (!file || !sectionId) {
    return NextResponse.json({ error: "File and sectionId are required" }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
  }

  const section = await db.projectSection.findUnique({ where: { id: sectionId } });
  if (!section || section.type !== "DELIVERY_NOTE") {
    return NextResponse.json({ error: "Invalid section" }, { status: 404 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const fileId = randomUUID();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `delivery-notes/${section.projectId}/${fileId}-${safeName}`;

  await uploadFile(storagePath, buffer, file.type);

  const fileMeta = {
    id: fileId,
    fileName: file.name,
    storagePath,
    size: buffer.length,
    mimeType: file.type,
    uploadedAt: new Date().toISOString(),
  };

  return NextResponse.json(fileMeta);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { storagePath } = await req.json();
  if (!storagePath || typeof storagePath !== "string") {
    return NextResponse.json({ error: "storagePath is required" }, { status: 400 });
  }
  if (!storagePath.startsWith("delivery-notes/")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    await deleteFile(storagePath);
  } catch {
    // already gone — ignore
  }

  return NextResponse.json({ ok: true });
}
