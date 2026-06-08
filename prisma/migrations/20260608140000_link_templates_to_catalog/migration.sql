-- AlterTable
ALTER TABLE "offer_template_components"
  ADD COLUMN "catalogItemId" TEXT,
  ADD COLUMN "catalogItemVariantId" TEXT;

-- AddForeignKey
ALTER TABLE "offer_template_components"
  ADD CONSTRAINT "offer_template_components_catalogItemId_fkey"
  FOREIGN KEY ("catalogItemId") REFERENCES "catalog_items"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "offer_template_components"
  ADD CONSTRAINT "offer_template_components_catalogItemVariantId_fkey"
  FOREIGN KEY ("catalogItemVariantId") REFERENCES "catalog_item_variants"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
