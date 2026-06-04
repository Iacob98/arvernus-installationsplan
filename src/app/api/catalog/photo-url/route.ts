import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getFileUrl } from "@/lib/storage";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const path = new URL(req.url).searchParams.get("path");
  if (!path) {
    return NextResponse.json({ error: "path missing" }, { status: 400 });
  }
  try {
    const url = await getFileUrl(path);
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
}
