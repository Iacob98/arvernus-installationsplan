import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadFile, getFileUrl } from "@/lib/storage";
import sharp from "sharp";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "Datei fehlt" }, { status: 400 });
  }

  const original = Buffer.from(await file.arrayBuffer());

  let buffer: Buffer = original;
  let contentType = file.type || "image/jpeg";
  let ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";

  try {
    const processed = await sharp(original)
      .resize(900, 900, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    buffer = Buffer.from(processed);
    contentType = "image/jpeg";
    ext = "jpg";
  } catch {
    // not an image — fall back to raw upload
  }

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const storagePath = `catalog/${id}.${ext}`;
  await uploadFile(storagePath, buffer, contentType);
  const url = await getFileUrl(storagePath);

  return NextResponse.json({ storagePath, url });
}
