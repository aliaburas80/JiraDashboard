-- P0B-07: durable, idempotent product analytics event storage.
CREATE TABLE "ProductAnalyticsEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "schemaVersion" INTEGER NOT NULL,
    "eventName" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,
    "anonymousId" TEXT,
    "sessionId" TEXT,
    "page" TEXT NOT NULL,
    "section" TEXT,
    "component" TEXT,
    "appVersion" TEXT NOT NULL,
    "role" TEXT,
    "browserFamily" TEXT NOT NULL,
    "browserMajor" TEXT NOT NULL,
    "osFamily" TEXT NOT NULL,
    "deviceCategory" TEXT NOT NULL,
    "resultStatus" TEXT,
    "durationMs" INTEGER,
    "propertiesJson" TEXT NOT NULL DEFAULT '{}',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductAnalyticsEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProductAnalyticsEvent_eventId_key" ON "ProductAnalyticsEvent"("eventId");
CREATE INDEX "ProductAnalyticsEvent_eventName_occurredAt_idx" ON "ProductAnalyticsEvent"("eventName", "occurredAt");
CREATE INDEX "ProductAnalyticsEvent_userId_occurredAt_idx" ON "ProductAnalyticsEvent"("userId", "occurredAt");
CREATE INDEX "ProductAnalyticsEvent_anonymousId_occurredAt_idx" ON "ProductAnalyticsEvent"("anonymousId", "occurredAt");
CREATE INDEX "ProductAnalyticsEvent_sessionId_occurredAt_idx" ON "ProductAnalyticsEvent"("sessionId", "occurredAt");
CREATE INDEX "ProductAnalyticsEvent_occurredAt_idx" ON "ProductAnalyticsEvent"("occurredAt");
