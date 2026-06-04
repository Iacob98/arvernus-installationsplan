-- CreateEnum
CREATE TYPE "CatalogItemType" AS ENUM ('WAERMEPUMPE', 'HEIZUNGSSPEICHER', 'WARMWASSERSPEICHER', 'ANDERE');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "OfferDiscountKind" AS ENUM ('PERCENT', 'AMOUNT', 'FOERDERUNG');

-- AlterTable
ALTER TABLE "company_settings" ADD COLUMN "aboutText" TEXT;

-- CreateTable
CREATE TABLE "catalog_items" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "CatalogItemType" NOT NULL,
    "manufacturer" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "catalog_item_variants" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "photoStoragePath" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "technicalData" JSONB NOT NULL DEFAULT '[]',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "catalogItemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "catalog_item_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offers" (
    "id" TEXT NOT NULL,
    "offerNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Ihr Individuelles Angebot',
    "status" "OfferStatus" NOT NULL DEFAULT 'DRAFT',
    "validUntilDays" INTEGER NOT NULL DEFAULT 56,
    "pdfStoragePath" TEXT,
    "pdfFileName" TEXT,
    "emailSubject" TEXT,
    "emailBody" TEXT,
    "clientId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "offers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_positions" (
    "id" TEXT NOT NULL,
    "catalogItemVariantId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "itemType" "CatalogItemType" NOT NULL,
    "manufacturer" TEXT,
    "photoStoragePath" TEXT,
    "technicalData" JSONB NOT NULL DEFAULT '[]',
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,
    "offerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offer_positions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_discounts" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "kind" "OfferDiscountKind" NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "offerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offer_discounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "catalog_items_type_idx" ON "catalog_items"("type");

-- CreateIndex
CREATE INDEX "catalog_item_variants_catalogItemId_idx" ON "catalog_item_variants"("catalogItemId");

-- CreateIndex
CREATE UNIQUE INDEX "offers_offerNumber_key" ON "offers"("offerNumber");

-- CreateIndex
CREATE INDEX "offers_clientId_idx" ON "offers"("clientId");

-- CreateIndex
CREATE INDEX "offers_status_idx" ON "offers"("status");

-- CreateIndex
CREATE INDEX "offer_positions_offerId_idx" ON "offer_positions"("offerId");

-- CreateIndex
CREATE INDEX "offer_discounts_offerId_idx" ON "offer_discounts"("offerId");

-- AddForeignKey
ALTER TABLE "catalog_item_variants" ADD CONSTRAINT "catalog_item_variants_catalogItemId_fkey" FOREIGN KEY ("catalogItemId") REFERENCES "catalog_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offers" ADD CONSTRAINT "offers_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_positions" ADD CONSTRAINT "offer_positions_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_discounts" ADD CONSTRAINT "offer_discounts_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
