import { NextResponse } from "next/server";
import { getMyUnreadInboundCount } from "@/lib/actions/clients";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const count = await getMyUnreadInboundCount();
    return NextResponse.json(
      { count },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json({ count: 0 }, { status: 200 });
  }
}
