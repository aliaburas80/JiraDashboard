-- EMERGENCY ROLLBACK of 20260809000002_tighten_organization_not_null.
-- The live site returned 503 on / and /login immediately after that
-- migration applied — reverting the NOT NULL constraint back to nullable
-- to restore compatibility with the currently-deployed app build (which
-- was compiled before organizationId existed and cannot supply it on
-- writes). No data is lost by this rollback — every row still has its
-- backfilled organizationId value, only the constraint is relaxed.

ALTER TABLE "DashboardSnapshot" ALTER COLUMN "organizationId" DROP NOT NULL;
ALTER TABLE "ImportLog" ALTER COLUMN "organizationId" DROP NOT NULL;
ALTER TABLE "JiraConnection" ALTER COLUMN "organizationId" DROP NOT NULL;
ALTER TABLE "Notification" ALTER COLUMN "organizationId" DROP NOT NULL;
ALTER TABLE "User" ALTER COLUMN "organizationId" DROP NOT NULL;
ALTER TABLE "UserAddRequest" ALTER COLUMN "organizationId" DROP NOT NULL;
