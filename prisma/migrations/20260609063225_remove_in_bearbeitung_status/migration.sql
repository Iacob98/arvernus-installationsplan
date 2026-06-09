-- Migrate existing clients in IN_BEARBEITUNG back to NEU
UPDATE "clients" SET "status" = 'NEU' WHERE "status" = 'IN_BEARBEITUNG';

-- Drop substatus / dealProbability columns
ALTER TABLE "clients" DROP COLUMN "substatus";
ALTER TABLE "clients" DROP COLUMN "dealProbability";

-- Drop unused enums
DROP TYPE "ClientSubstatus";
DROP TYPE "DealProbability";

-- Recreate ClientStatus without IN_BEARBEITUNG
ALTER TABLE "clients" ALTER COLUMN "status" DROP DEFAULT;
CREATE TYPE "ClientStatus_new" AS ENUM ('NEU', 'ANGERUFEN', 'ANGEBOT_VERSENDET', 'VERKAUFT', 'NICHT_VERKAUFT');
ALTER TABLE "clients" ALTER COLUMN "status" TYPE "ClientStatus_new" USING ("status"::text::"ClientStatus_new");
ALTER TYPE "ClientStatus" RENAME TO "ClientStatus_old";
ALTER TYPE "ClientStatus_new" RENAME TO "ClientStatus";
DROP TYPE "ClientStatus_old";
ALTER TABLE "clients" ALTER COLUMN "status" SET DEFAULT 'NEU';
