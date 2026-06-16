import nodemailer from "nodemailer";

const globalForSmtp = globalThis as unknown as {
  smtpTransporter: nodemailer.Transporter | undefined;
};

export const smtpTransporter =
  globalForSmtp.smtpTransporter ??
  nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    // Der Mailserver (Exim) bricht den DATA-Upload gelegentlich mit
    // "421 incoming data timeout" ab. Ohne Timeouts würde der Versand dann
    // unbegrenzt hängen — lieber schnell scheitern und neu versuchen.
    connectionTimeout: 15_000,
    greetingTimeout: 10_000,
    socketTimeout: 30_000,
  });

if (process.env.NODE_ENV !== "production")
  globalForSmtp.smtpTransporter = smtpTransporter;

/** SMTP-Fehlercodes, bei denen ein erneuter Versuch sinnvoll ist. */
const TRANSIENT_CODES = new Set([
  "ETIMEDOUT",
  "ESOCKET",
  "ECONNRESET",
  "ECONNECTION",
  "EMESSAGE",
]);

function isTransient(err: unknown): boolean {
  const e = err as { code?: string; responseCode?: number } | null;
  if (!e) return false;
  // 421 = Service nicht verfügbar / "incoming data timeout"; 4xx generell transient.
  if (typeof e.responseCode === "number" && e.responseCode >= 400 && e.responseCode < 500)
    return true;
  return typeof e.code === "string" && TRANSIENT_CODES.has(e.code);
}

/**
 * Versendet eine Mail mit Wiederholung bei transienten Fehlern (z. B. dem
 * sporadischen "421 incoming data timeout" des Mailservers). Normaler Versand
 * dauert < 3 s, ein Retry ist also günstig und behebt fast alle Aussetzer.
 */
export async function sendMailWithRetry(
  options: Parameters<typeof smtpTransporter.sendMail>[0],
  attempts = 3,
) {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await smtpTransporter.sendMail(options);
    } catch (err) {
      lastErr = err;
      if (i === attempts - 1 || !isTransient(err)) throw err;
      await new Promise((r) => setTimeout(r, 1_500 * (i + 1)));
    }
  }
  throw lastErr;
}
