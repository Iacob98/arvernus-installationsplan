import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getFileBuffer } from "@/lib/storage";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const offer = await db.offer.findUnique({ where: { id } });
  if (!offer || !offer.pdfStoragePath) {
    return NextResponse.json({ error: "PDF nicht gefunden" }, { status: 404 });
  }

  const inline = new URL(req.url).searchParams.get("inline") === "1";
  const fileName = offer.pdfFileName ?? `${offer.offerNumber}.pdf`;

  try {
    const buffer = await getFileBuffer(offer.pdfStoragePath);
    const disposition = `${inline ? "inline" : "attachment"}; filename="${fileName}"`;
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": disposition,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch {
    return NextResponse.json({ error: "PDF nicht gefunden" }, { status: 404 });
  }
}
