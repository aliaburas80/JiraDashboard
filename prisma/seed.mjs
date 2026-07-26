// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Seed script — creates the first admin user for PostgreSQL deployments.

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? 'admin@deliveryclarity.com';
  const password = process.env.ADMIN_PASSWORD ?? 'Admin@DC2025';
  const name = process.env.ADMIN_NAME ?? 'Administrator';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    // emailVerified: true — this is the bootstrap admin account created by
    // whoever is deploying the app; there's no inbound verification email to
    // click at this point (SMTP may not even be configured yet), and EP-011
    // blocks uploads for any account with emailVerified: false (schema
    // default). Without this, the very first admin account on any fresh
    // deployment — and the seeded E2E admin, whose critical-path test
    // exercises exactly this upload flow — could never upload anything.
    data: { name, email, passwordHash, role: 'admin', mustChangePassword: true, emailVerified: true },
  });

  console.log(`Admin created: ${user.email} (id: ${user.id})`);
  console.log('Change the password after first login.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
