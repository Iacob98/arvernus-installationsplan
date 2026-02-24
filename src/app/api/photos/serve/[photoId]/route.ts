import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getFileBuffer } from "@/lib/storage";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { photoId } = await params;
  const url = new URL(req.url);
  const thumb = url.searchParams.get("thumb") === "1";

  const photo = await db.photo.findUnique({ where: { id: photoId } });
  if (!photo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const path = thumb && photo.thumbnailPath ? photo.thumbnailPath : photo.storagePath;

  try {
    const buffer = await getFileBuffer(path);
    const contentType = thumb ? "image/jpeg" : photo.mimeType;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
