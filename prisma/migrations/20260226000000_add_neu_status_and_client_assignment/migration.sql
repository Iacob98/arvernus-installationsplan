-- AlterEnum (must be outside a transaction for Postgres)
ALTER TYPE "ClientStatus" ADD VALUE IF NOT EXISTS 'NEU' BEFORE 'IN_BEARBEITUNG';
