-- EP-014: Consent and Legal Document Versioning
-- Adds termsAcceptedAt and termsVersion to User.
-- Backfills existing admin-created users as having accepted v1
-- (they were invited by the owner and are fully trusted).

ALTER TABLE "User" ADD COLUMN "termsAcceptedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "termsVersion"    TEXT NOT NULL DEFAULT '';

-- Existing users are admin-created and trusted — backfill as accepted.
UPDATE "User"
SET    "termsAcceptedAt" = "createdAt",
       "termsVersion"    = 'v1'
WHERE  "termsAcceptedAt" IS NULL;
