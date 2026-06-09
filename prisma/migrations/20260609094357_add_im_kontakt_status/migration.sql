-- Insert IM_KONTAKT between ANGEBOT_VERSENDET and VERKAUFT via enum recreate.
ALTER TABLE "clients" ALTER COLUMN "status" DROP DEFAULT;
CREATE TYPE "ClientStatus_new" AS ENUM ('NEU', 'ANGERUFEN', 'ANGEBOT_VERSENDET', 'IM_KONTAKT', 'VERKAUFT', 'NICHT_VERKAUFT');
ALTER TABLE "clients" ALTER COLUMN "status" TYPE "ClientStatus_new" USING ("status"::text::"ClientStatus_new");
ALTER TYPE "ClientStatus" RENAME TO "ClientStatus_old";
ALTER TYPE "ClientStatus_new" RENAME TO "ClientStatus";
DROP TYPE "ClientStatus_old";
ALTER TABLE "clients" ALTER COLUMN "status" SET DEFAULT 'NEU';
