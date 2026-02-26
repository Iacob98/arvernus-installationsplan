import { auth } from "@/lib/auth";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("Nicht authentifiziert");
  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();
  if (session.user.role !== "ADMIN") throw new Error("Keine Berechtigung");
  return session;
}

export function isAdmin(session: { user: { role?: string } }) {
  return session.user.role === "ADMIN";
}

const PIN_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

export function generatePin(length = 8): string {
  let pin = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    pin += PIN_CHARS[array[i] % PIN_CHARS.length];
  }
  return pin;
}
