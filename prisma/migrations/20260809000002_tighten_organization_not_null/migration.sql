-- ORG-04 (product/MULTI_TENANT_ORG_DESIGN.md §9) — Phase 1b of 2. Tightens
-- organizationId to NOT NULL on every model except AuditEvent (which stays
-- permanently nullable by design, mirroring its existing nullable userId).
-- Safe to apply only because prisma/backfillDefaultOrganization.ts has
-- already run against this database and confirmed (re-checked via its own
-- --dry-run count) that zero rows remain with a NULL organizationId in any
-- of the six tables below.

-- AlterTable
ALTER TABLE "DashboardSnapshot" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "ImportLog" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "JiraConnection" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Notification" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "organizationId" SET NOT NULL;

-- AlterTable
ALTER TABLE "UserAddRequest" ALTER COLUMN "organizationId" SET NOT NULL;
