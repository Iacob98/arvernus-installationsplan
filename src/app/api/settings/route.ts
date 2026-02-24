import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const settings = await db.companySettings.findFirst();
  return NextResponse.json(settings);
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await req.json();
  const { id, createdAt, updatedAt, ...updateData } = data;

  const settings = await db.companySettings.upsert({
    where: { id: id || "default" },
    update: updateData,
    create: { id: "default", ...updateData },
  });

  return NextResponse.json(settings);
}
