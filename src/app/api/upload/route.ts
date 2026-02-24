import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadFile } from "@/lib/storage";
import sharp from "sharp";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File;
  const sectionId = formData.get("sectionId") as string;
  const heatingCircuitItemId = formData.get("heatingCircuitItemId") as string | null;

  if (!file || !sectionId) {
    return NextResponse.json(
      { error: "File and sectionId are required" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const timestamp = Date.now();
  const ext = file.name.split(".").pop();
  const baseName = `${timestamp}-${Math.random().toString(36).slice(2, 8)}`;

  // Get image dimensions
  let width: number | undefined;
  let height: number | undefined;
  try {
    const metadata = await sharp(buffer).metadata();
    width = metadata.width;
    height = metadata.height;
  } catch {
    // Not an image or sharp can't process it
  }

  // Upload original
  const storagePath = `photos/${baseName}.${ext}`;
  await uploadFile(storagePath, buffer, file.type);

  // Create thumbnail
  let thumbnailPath: string | undefined;
  if (width && height) {
    try {
      const thumbBuffer = await sharp(buffer)
        .resize(400, 300, { fit: "cover" })
        .jpeg({ quality: 80 })
        .toBuffer();
      thumbnailPath = `photos/thumbs/${baseName}.jpg`;
      await uploadFile(thumbnailPath, thumbBuffer, "image/jpeg");
    } catch {
      // Thumbnail creation failed, not critical
    }
  }

  // Save to database
  const photoCount = await db.photo.count({ where: { sectionId } });
  const photo = await db.photo.create({
    data: {
      fileName: file.name,
      storagePath,
      thumbnailPath,
      mimeType: file.type,
      size: buffer.length,
      width,
      height,
      sectionId,
      heatingCircuitItemId: heatingCircuitItemId || undefined,
      order: photoCount,
    },
  });

  return NextResponse.json(photo);
}
