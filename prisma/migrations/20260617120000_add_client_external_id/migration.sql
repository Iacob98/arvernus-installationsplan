-- AlterTable: external lead id for imports (OBI Partnercenter) + dedup index
ALTER TABLE "clients" ADD COLUMN "externalId" TEXT;

-- CreateIndex: one external lead per source (NULLs distinct → existing clients unaffected)
CREATE UNIQUE INDEX "clients_source_externalId_key" ON "clients"("source", "externalId");
