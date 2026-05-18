-- CreateTable
CREATE TABLE "client_attachments" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "clientId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "client_attachments_clientId_idx" ON "client_attachments"("clientId");

-- AddForeignKey
ALTER TABLE "client_attachments" ADD CONSTRAINT "client_attachments_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_attachments" ADD CONSTRAINT "client_attachments_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
