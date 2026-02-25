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
  });

if (process.env.NODE_ENV !== "production")
  globalForSmtp.smtpTransporter = smtpTransporter;
