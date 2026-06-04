-- CreateEnum
CREATE TYPE "CallOutcome" AS ENUM ('REACHED', 'NOT_REACHED', 'VOICEMAIL', 'BUSY');

-- CreateTable
CREATE TABLE "call_logs" (
    "id" TEXT NOT NULL,
    "calledAt" TIMESTAMP(3) NOT NULL,
    "outcome" "CallOutcome" NOT NULL,
    "notes" TEXT,
    "nextCallAt" TIMESTAMP(3),
    "reminderId" TEXT,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "call_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "call_logs_clientId_idx" ON "call_logs"("clientId");

-- CreateIndex
CREATE INDEX "call_logs_calledAt_idx" ON "call_logs"("calledAt");

-- AddForeignKey
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "call_logs" ADD CONSTRAINT "call_logs_reminderId_fkey" FOREIGN KEY ("reminderId") REFERENCES "reminders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
