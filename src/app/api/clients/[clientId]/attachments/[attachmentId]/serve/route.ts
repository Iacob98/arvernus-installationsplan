import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getFileBuffer } from "@/lib/storage";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ clientId: string; attachmentId: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId, attachmentId } = await params;

  const attachment = await db.clientAttachment.findUnique({
    where: { id: attachmentId },
    include: { client: { select: { assignedToId: true } } },
  });
  if (!attachment || attachment.clientId !== clientId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (
    session.user.role !== "ADMIN" &&
    attachment.client.assignedToId !== session.user.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(req.url);
  const download = url.searchParams.get("download") === "1";

  try {
    const buffer = await getFileBuffer(attachment.storagePath);
    const headers: Record<string, string> = {
      "Content-Type": attachment.mimeType,
      "Cache-Control": "private, max-age=3600",
    };
    if (download) {
      const safeName = attachment.fileName.replace(/"/g, "");
      headers["Content-Disposition"] = `attachment; filename="${safeName}"`;
    } else {
      headers["Content-Disposition"] = "inline";
    }

    return new NextResponse(new Uint8Array(buffer), { headers });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
