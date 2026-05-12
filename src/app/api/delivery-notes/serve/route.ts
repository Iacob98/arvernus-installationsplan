import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getFileBuffer } from "@/lib/storage";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const path = url.searchParams.get("path");
  const download = url.searchParams.get("download") === "1";

  if (!path || !path.startsWith("delivery-notes/")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    const buffer = await getFileBuffer(path);
    const fileName = path.split("/").pop() ?? "lieferschein.pdf";
    const disposition = download
      ? `attachment; filename="${fileName}"`
      : `inline; filename="${fileName}"`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": disposition,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
