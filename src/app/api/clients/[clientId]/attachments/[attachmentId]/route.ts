import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteFile } from "@/lib/storage";

export async function DELETE(
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

  try {
    await deleteFile(attachment.storagePath);
  } catch {
    // Storage delete failed, continue with DB cleanup
  }

  await db.clientAttachment.delete({ where: { id: attachmentId } });
  return NextResponse.json({ success: true });
}
