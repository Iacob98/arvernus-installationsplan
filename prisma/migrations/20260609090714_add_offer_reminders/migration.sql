-- CreateEnum
CREATE TYPE "OfferReminderStatus" AS ENUM ('SCHEDULED', 'SENT', 'CANCELLED', 'SKIPPED', 'FAILED');

-- CreateTable
CREATE TABLE "offer_reminder_templates" (
    "step" INTEGER NOT NULL,
    "subject" TEXT NOT NULL,
    "htmlBody" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offer_reminder_templates_pkey" PRIMARY KEY ("step")
);

-- CreateTable
CREATE TABLE "offer_reminders" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "step" INTEGER NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "OfferReminderStatus" NOT NULL DEFAULT 'SCHEDULED',
    "jobId" TEXT,
    "emailLogId" TEXT,
    "sentAt" TIMESTAMP(3),
    "skippedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offer_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "offer_reminders_offerId_idx" ON "offer_reminders"("offerId");

-- CreateIndex
CREATE INDEX "offer_reminders_status_scheduledAt_idx" ON "offer_reminders"("status", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "offer_reminders_offerId_step_key" ON "offer_reminders"("offerId", "step");

-- AddForeignKey
ALTER TABLE "offer_reminders" ADD CONSTRAINT "offer_reminders_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
