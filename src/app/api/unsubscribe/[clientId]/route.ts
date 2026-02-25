import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;

  try {
    await db.client.update({
      where: { id: clientId },
      data: { unsubscribed: true },
    });
  } catch {
    return new NextResponse(
      `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><title>Fehler</title></head>
<body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f5f5f5">
  <div style="text-align:center;padding:2rem;background:white;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.1)">
    <h1 style="color:#e11d48">Fehler</h1>
    <p>Der Abmeldelink ist ungültig.</p>
  </div>
</body>
</html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  return new NextResponse(
    `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><title>Abgemeldet</title></head>
<body style="font-family:sans-serif;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#f5f5f5">
  <div style="text-align:center;padding:2rem;background:white;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.1)">
    <h1 style="color:#16a34a">&#10003;</h1>
    <h2>Erfolgreich abgemeldet</h2>
    <p>Sie wurden erfolgreich von unseren Kampagnen-E-Mails abgemeldet.</p>
  </div>
</body>
</html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
