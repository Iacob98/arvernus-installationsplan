-- CreateEnum
CREATE TYPE "EmailDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- DropForeignKey (sentById was NOT NULL; we need to relax it)
ALTER TABLE "email_logs" DROP CONSTRAINT IF EXISTS "email_logs_sentById_fkey";

-- AlterTable: relax sentById, add inbox-related columns
ALTER TABLE "email_logs"
  ALTER COLUMN "sentById" DROP NOT NULL,
  ADD COLUMN "htmlBody"    TEXT,
  ADD COLUMN "direction"   "EmailDirection" NOT NULL DEFAULT 'OUTBOUND',
  ADD COLUMN "fromAddress" TEXT,
  ADD COLUMN "messageId"   TEXT,
  ADD COLUMN "inReplyTo"   TEXT,
  ADD COLUMN "read"        BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "imapUid"     INTEGER;

-- Re-add sentById FK as SetNull on user delete
ALTER TABLE "email_logs"
  ADD CONSTRAINT "email_logs_sentById_fkey"
  FOREIGN KEY ("sentById") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Indexes
CREATE UNIQUE INDEX "email_logs_messageId_key" ON "email_logs"("messageId");
CREATE INDEX "email_logs_clientId_direction_read_idx"
  ON "email_logs"("clientId", "direction", "read");
CREATE INDEX "email_logs_clientId_createdAt_idx"
  ON "email_logs"("clientId", "createdAt");

-- Client: last inbound bookkeeping
ALTER TABLE "clients"
  ADD COLUMN "lastInboundAt"         TIMESTAMP(3),
  ADD COLUMN "lastInboundEmailLogId" TEXT;

-- User: personal email signature
ALTER TABLE "users" ADD COLUMN "emailSignature" TEXT;
