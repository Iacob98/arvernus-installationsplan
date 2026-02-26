-- AlterTable: set default and add assignment column
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "assignedToId" TEXT;
ALTER TABLE "clients" ALTER COLUMN "status" SET DEFAULT 'NEU';

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
