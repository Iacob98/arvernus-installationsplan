-- AlterTable: track final async-send failure for offers
ALTER TABLE "offers" ADD COLUMN "sendFailedAt" TIMESTAMP(3);
ALTER TABLE "offers" ADD COLUMN "sendError" TEXT;
