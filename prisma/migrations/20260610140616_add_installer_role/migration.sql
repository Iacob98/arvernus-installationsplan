-- Add INSTALLER value to the Role enum (Postgres supports adding values
-- to an enum without recreating it; existing rows are untouched).
ALTER TYPE "Role" ADD VALUE 'INSTALLER';
