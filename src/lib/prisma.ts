// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Singleton Prisma client — prevents connection pool exhaustion in Next.js dev.

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
const databaseUrl = process.env.DATABASE_URL?.trim();

if (process.env.NODE_ENV !== 'test' && !/^postgres(?:ql)?:\/\//.test(databaseUrl ?? '')) {
  throw new Error(
    'Invalid server environment: DATABASE_URL must be a PostgreSQL connection string.',
  );
}

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
