-- EP-011: Public Registration Fields
-- Adds emailVerified and persona to the User table.
-- Backfills: all EXISTING users (admin-created, trusted) are marked as verified.
-- New self-registered users will start as emailVerified = false until EP-012 flow.

ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "persona"        TEXT    NOT NULL DEFAULT '';

-- Existing users were created by admins and are fully trusted — mark as verified.
UPDATE "User" SET "emailVerified" = true WHERE "emailVerified" = false;

CREATE INDEX "User_emailVerified_idx" ON "User"("emailVerified");
