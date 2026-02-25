import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }

  const email = body.email;
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "E-Mail ist erforderlich" }, { status: 400 });
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();

    const clients = await db.client.findMany({
      where: { email: normalizedEmail },
      select: { id: true, unsubscribed: true },
    });

    if (clients.length === 0) {
      return NextResponse.json({ error: "Diese E-Mail-Adresse wurde nicht gefunden" }, { status: 404 });
    }

    const alreadyUnsubscribed = clients.every((c) => c.unsubscribed);
    if (alreadyUnsubscribed) {
      return NextResponse.json({ message: "Bereits abgemeldet" });
    }

    await db.client.updateMany({
      where: { email: normalizedEmail },
      data: { unsubscribed: true },
    });

    return NextResponse.json({ message: "Erfolgreich abgemeldet" });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.json({ error: "Ein Fehler ist aufgetreten" }, { status: 500 });
  }
}
