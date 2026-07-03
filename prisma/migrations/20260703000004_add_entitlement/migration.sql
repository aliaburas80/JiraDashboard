-- EP-015: Trial Entitlement State Machine
-- Creates the Entitlement table and backfills one record per existing user.
-- All existing users start as 'eligible' so no currently-working accounts break.
-- Admin users get an unlimited flag via the check in the upload route (role=admin bypasses).

CREATE TABLE "Entitlement" (
  "id"           TEXT         NOT NULL,
  "userId"       TEXT         NOT NULL,
  "workspaceId"  TEXT,
  "status"       TEXT         NOT NULL DEFAULT 'eligible',
  "consumedAt"   TIMESTAMP(3),
  "expiresAt"    TIMESTAMP(3),
  "importLogId"  TEXT,
  "restoredBy"   TEXT,
  "restoredAt"   TIMESTAMP(3),
  "restoredNote" TEXT,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Entitlement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Entitlement_userId_key"    ON "Entitlement"("userId");
CREATE        INDEX "Entitlement_status_idx"   ON "Entitlement"("status");
CREATE        INDEX "Entitlement_expiresAt_idx" ON "Entitlement"("expiresAt");
CREATE        INDEX "Entitlement_userId_idx"    ON "Entitlement"("userId");

-- Foreign key: user
ALTER TABLE "Entitlement"
  ADD CONSTRAINT "Entitlement_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Foreign key: importLog (optional — set when entitlement is consumed)
ALTER TABLE "Entitlement"
  ADD CONSTRAINT "Entitlement_importLogId_fkey"
  FOREIGN KEY ("importLogId") REFERENCES "ImportLog"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: create one 'eligible' entitlement per existing user.
-- Links each entitlement to the user's workspace (if it exists).
INSERT INTO "Entitlement" ("id", "userId", "workspaceId", "status", "createdAt", "updatedAt")
SELECT
  gen_random_uuid()::TEXT,
  u."id",
  w."id",
  'eligible',
  u."createdAt",
  u."createdAt"
FROM "User" u
LEFT JOIN "Workspace" w ON w."ownerUserId" = u."id";
