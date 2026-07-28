-- AlterTable
ALTER TABLE "AuditEvent" ADD COLUMN "correlationId" TEXT;

-- AlterTable
ALTER TABLE "SystemErrorLog" ADD COLUMN "correlationId" TEXT;

-- CreateIndex
CREATE INDEX "AuditEvent_correlationId_idx" ON "AuditEvent"("correlationId");

-- CreateIndex
CREATE INDEX "SystemErrorLog_correlationId_idx" ON "SystemErrorLog"("correlationId");
