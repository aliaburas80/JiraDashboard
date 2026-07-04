-- EP-017: per-user privacy choice — "cloud" (default) keeps uploaded Jira data +
-- computed metrics server-side; "local" keeps them in the user's own browser only.
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "dataStorageMode" TEXT NOT NULL DEFAULT 'cloud';
