-- P0A-06: add missing performance indexes.
-- These support common admin queries that currently do full-table scans.

-- Admin audit log filtering by event type + date range
CREATE INDEX IF NOT EXISTS "AuditEvent_eventType_createdAt_idx"
  ON "AuditEvent"("eventType", "createdAt");

-- Fast "find last successful import" used by /api/metrics and upload UI
CREATE INDEX IF NOT EXISTS "ImportLog_status_uploadedAt_idx"
  ON "ImportLog"("status", "uploadedAt");
