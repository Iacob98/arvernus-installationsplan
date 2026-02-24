import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getFileUrl, deleteFile } from "@/lib/storage";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const { photoId } = await params;
  const photo = await db.photo.findUnique({ where: { id: photoId } });
  if (!photo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = await getFileUrl(photo.storagePath);
  const thumbnailUrl = photo.thumbnailPath
    ? await getFileUrl(photo.thumbnailPath)
    : null;

  return NextResponse.json({ ...photo, url, thumbnailUrl });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { photoId } = await params;
  const data = await req.json();

  const photo = await db.photo.update({
    where: { id: photoId },
    data: {
      annotations: data.annotations,
      caption: data.caption,
      order: data.order,
    },
  });

  return NextResponse.json(photo);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ photoId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { photoId } = await params;
  const photo = await db.photo.findUnique({ where: { id: photoId } });
  if (!photo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await deleteFile(photo.storagePath);
    if (photo.thumbnailPath) await deleteFile(photo.thumbnailPath);
  } catch {
    // Storage delete failed, continue with DB cleanup
  }

  await db.photo.delete({ where: { id: photoId } });
  return NextResponse.json({ success: true });
}
