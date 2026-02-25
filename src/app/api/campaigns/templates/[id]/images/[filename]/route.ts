import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getFileBuffer } from "@/lib/storage";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; filename: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
  }

  const { id, filename } = await params;

  const image = await db.emailTemplateImage.findFirst({
    where: {
      templateId: id,
      filename: decodeURIComponent(filename),
    },
  });

  if (!image) {
    return NextResponse.json({ error: "Bild nicht gefunden" }, { status: 404 });
  }

  const buffer = await getFileBuffer(image.storagePath);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
