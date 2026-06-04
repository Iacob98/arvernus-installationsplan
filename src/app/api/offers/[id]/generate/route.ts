import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { regenerateOfferPdf } from "@/lib/actions/offers";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  try {
    const result = await regenerateOfferPdf(id);
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "PDF generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
