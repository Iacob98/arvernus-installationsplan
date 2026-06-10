/**
 * Plain-text and HTML signature helpers + From-header builder for outbound
 * email. The "-- " separator (trailing space) is the RFC 3676 signature
 * marker that Gmail / Outlook collapse automatically when threading.
 */

type SignatureUser = {
  name: string;
  emailSignature?: string | null;
};

function signatureText(user: SignatureUser): string {
  const sig = (user.emailSignature ?? "").trim();
  return sig || user.name;
}

export function appendSignaturePlain(body: string, user: SignatureUser): string {
  const sig = signatureText(user);
  return `${body.trimEnd()}\n\n-- \n${sig}\n`;
}

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]!);
}

export function appendSignatureHtml(
  htmlBody: string,
  user: SignatureUser,
): string {
  const sig = signatureText(user);
  const safe = escapeHtml(sig).replace(/\r?\n/g, "<br>");
  return `${htmlBody}<br><br>-- <br>${safe}`;
}

/**
 * Build a From-header in the form `"Display Name" <addr@host>`. Quoting
 * follows RFC 5322 — Name with special chars (",", ";", "<", ">", "\"") is
 * wrapped in quoted-string and backslash-escaped.
 */
export function buildFromHeader(
  user: { name: string },
  fallbackAddress: string,
): string {
  if (!user.name) return fallbackAddress;
  const needsQuoting = /[",;<>()@:\\.[\]]/.test(user.name);
  const safeName = needsQuoting
    ? `"${user.name.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`
    : user.name;
  return `${safeName} <${fallbackAddress}>`;
}
