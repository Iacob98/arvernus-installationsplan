import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "E-Mail ist erforderlich" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const client = await db.client.findFirst({
    where: { email: { equals: normalizedEmail, mode: "insensitive" } },
  });

  if (!client) {
    return NextResponse.json({ error: "Diese E-Mail-Adresse wurde nicht gefunden" }, { status: 404 });
  }

  if (client.unsubscribed) {
    return NextResponse.json({ message: "Bereits abgemeldet" });
  }

  await db.client.update({
    where: { id: client.id },
    data: { unsubscribed: true },
  });

  return NextResponse.json({ message: "Erfolgreich abgemeldet" });
}
