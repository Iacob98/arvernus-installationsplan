import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getFileBuffer } from "@/lib/storage";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const document = await db.document.findUnique({ where: { id } });

  if (!document || document.status !== "COMPLETED") {
    return NextResponse.json({ error: "Document not found or not ready" }, { status: 404 });
  }

  const url = new URL(req.url);
  const inline = url.searchParams.get("inline") === "1";

  try {
    const buffer = await getFileBuffer(document.storagePath);
    const disposition = inline
      ? `inline; filename="${document.fileName}"`
      : `attachment; filename="${document.fileName}"`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": disposition,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found in storage" }, { status: 404 });
  }
}
