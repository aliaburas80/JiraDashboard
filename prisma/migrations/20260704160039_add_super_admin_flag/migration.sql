-- EP-016: super-admin protection flag — role stays "admin", but this account cannot
-- be modified or deleted by any other admin (enforced in app/api/admin/users/route.ts).
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false;
