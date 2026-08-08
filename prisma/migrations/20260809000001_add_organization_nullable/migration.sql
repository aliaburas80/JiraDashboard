-- ORG-04 (product/MULTI_TENANT_ORG_DESIGN.md §9) — Phase 1a of 2. Purely
-- additive: adds the Organization table and a nullable organizationId column
-- on every canonical model, per the design doc's explicit "never a single
-- migration that adds a non-nullable FK with no backfill step" rule. No
-- existing row is modified, no column is dropped or retyped, no NOT NULL
-- constraint is added here. Phase 1b (a separate migration) backfills every
-- existing row to a default Organization and only then tightens these
-- columns to non-nullable.

-- AlterTable
ALTER TABLE "AuditEvent" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "DashboardSnapshot" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "ImportLog" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "JiraConnection" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "organizationId" TEXT;

-- AlterTable
ALTER TABLE "UserAddRequest" ADD COLUMN     "organizationId" TEXT;

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "domainVerifiedAt" TIMESTAMP(3),
    "logoUrl" TEXT,
    "maxSeats" INTEGER NOT NULL DEFAULT 6,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_domain_key" ON "Organization"("domain");

-- CreateIndex
CREATE INDEX "Organization_domain_idx" ON "Organization"("domain");

-- CreateIndex
CREATE INDEX "Organization_status_idx" ON "Organization"("status");

-- CreateIndex
CREATE INDEX "AuditEvent_organizationId_idx" ON "AuditEvent"("organizationId");

-- CreateIndex
CREATE INDEX "DashboardSnapshot_organizationId_idx" ON "DashboardSnapshot"("organizationId");

-- CreateIndex
CREATE INDEX "ImportLog_organizationId_idx" ON "ImportLog"("organizationId");

-- CreateIndex
CREATE INDEX "JiraConnection_organizationId_idx" ON "JiraConnection"("organizationId");

-- CreateIndex
CREATE INDEX "Notification_organizationId_idx" ON "Notification"("organizationId");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE INDEX "UserAddRequest_organizationId_idx" ON "UserAddRequest"("organizationId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportLog" ADD CONSTRAINT "ImportLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardSnapshot" ADD CONSTRAINT "DashboardSnapshot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAddRequest" ADD CONSTRAINT "UserAddRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JiraConnection" ADD CONSTRAINT "JiraConnection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
