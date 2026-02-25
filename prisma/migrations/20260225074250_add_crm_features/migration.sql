-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('IN_BEARBEITUNG', 'VERKAUFT', 'NICHT_VERKAUFT');

-- CreateEnum
CREATE TYPE "ClientSubstatus" AS ENUM ('IN_KONTAKT', 'ANGEBOT_VERSENDET', 'NICHT_ERREICHBAR');

-- CreateEnum
CREATE TYPE "DealProbability" AS ENUM ('NIEDRIG', 'MITTEL', 'HOCH');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "dealProbability" "DealProbability",
ADD COLUMN     "source" TEXT,
ADD COLUMN     "status" "ClientStatus" NOT NULL DEFAULT 'IN_BEARBEITUNG',
ADD COLUMN     "substatus" "ClientSubstatus";

-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "clientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reminders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "recipients" TEXT[],
    "status" "EmailStatus" NOT NULL DEFAULT 'PENDING',
    "clientId" TEXT,
    "sentById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "imap_processed_emails" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "subject" TEXT,
    "fromAddress" TEXT,
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "imap_processed_emails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reminders_clientId_idx" ON "reminders"("clientId");

-- CreateIndex
CREATE INDEX "reminders_date_idx" ON "reminders"("date");

-- CreateIndex
CREATE INDEX "email_logs_clientId_idx" ON "email_logs"("clientId");

-- CreateIndex
CREATE UNIQUE INDEX "imap_processed_emails_messageId_key" ON "imap_processed_emails"("messageId");

-- AddForeignKey
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
