-- Performance indexes: cover the most-queried foreign-key and filter columns.
-- Prisma does not auto-index FK columns on SQLite; these fill that gap.

CREATE INDEX IF NOT EXISTS "Notification_recipientUserId_idx"    ON "Notification"    ("recipientUserId");
CREATE INDEX IF NOT EXISTS "Notification_readAt_idx"             ON "Notification"    ("readAt");
CREATE INDEX IF NOT EXISTS "UserAddRequest_requestedByUserId_idx" ON "UserAddRequest" ("requestedByUserId");
CREATE INDEX IF NOT EXISTS "UserAddRequest_status_idx"           ON "UserAddRequest"  ("status");
CREATE INDEX IF NOT EXISTS "Session_userId_idx"                  ON "Session"         ("userId");
CREATE INDEX IF NOT EXISTS "Session_expiresAt_idx"               ON "Session"         ("expiresAt");
CREATE INDEX IF NOT EXISTS "AuditEvent_userId_idx"               ON "AuditEvent"      ("userId");
CREATE INDEX IF NOT EXISTS "AuditEvent_createdAt_idx"            ON "AuditEvent"      ("createdAt");
CREATE INDEX IF NOT EXISTS "ImportLog_userId_idx"                ON "ImportLog"       ("userId");
CREATE INDEX IF NOT EXISTS "DashboardSnapshot_userId_idx"        ON "DashboardSnapshot" ("userId");
