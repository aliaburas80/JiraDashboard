// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Seed script — creates the first admin user.
// Run: npx ts-node prisma/seed.ts  OR  npx prisma db seed

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email    = process.env.ADMIN_EMAIL    ?? 'admin@deliveryclarity.com';
  const password = process.env.ADMIN_PASSWORD ?? 'Admin@DC2025';
  const name     = process.env.ADMIN_NAME     ?? 'Administrator';

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, role: 'admin' },
  });

  console.log(`✅ Admin created: ${user.email} (id: ${user.id})`);
  console.log(`   Change the password after first login!`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
