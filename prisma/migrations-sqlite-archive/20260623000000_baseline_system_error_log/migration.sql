-- Baseline migration for "SystemErrorLog".
-- This table was originally created via `prisma db push` and was never
-- captured by a migration (see DRIFT-01 in TODO-List.md). Using
-- `IF NOT EXISTS` / `IF NOT EXISTS` guards keeps this safe to apply against
-- existing databases that already have the table, while giving a fresh
-- environment running `prisma migrate deploy` the table it would otherwise
-- be missing.

-- CreateTable
CREATE TABLE IF NOT EXISTS "SystemErrorLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "errorCode" TEXT NOT NULL,
    "errorMessage" TEXT NOT NULL,
    "prismaModel" TEXT,
    "operation" TEXT NOT NULL,
    "context" TEXT,
    "payload" TEXT,
    "resolution" TEXT NOT NULL DEFAULT 'logged',
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastRetriedAt" DATETIME,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SystemErrorLog_errorCode_idx" ON "SystemErrorLog"("errorCode");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SystemErrorLog_createdAt_idx" ON "SystemErrorLog"("createdAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "SystemErrorLog_resolution_idx" ON "SystemErrorLog"("resolution");
