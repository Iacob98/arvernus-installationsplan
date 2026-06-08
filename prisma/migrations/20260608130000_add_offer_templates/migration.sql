-- CreateTable
CREATE TABLE "offer_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "offer_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "offer_template_components" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "type" "CatalogItemType" NOT NULL,
    "keyword" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "label" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "offer_template_components_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "offer_template_components_templateId_idx" ON "offer_template_components"("templateId");

-- AddForeignKey
ALTER TABLE "offer_template_components" ADD CONSTRAINT "offer_template_components_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "offer_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
