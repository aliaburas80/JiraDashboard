// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Singleton Prisma client — prevents connection pool exhaustion in Next.js dev.

import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

function normaliseSqliteDatabaseUrl(): void {
  const url = process.env.DATABASE_URL;
  if (!url?.startsWith('file:')) return;

  const rawPath = url.slice('file:'.length).replace(/^"|"$/g, '');
  if (!rawPath || path.isAbsolute(rawPath)) return;

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const dbPath = rawPath.startsWith('../data/') || rawPath.startsWith('./data/')
    ? path.join(dataDir, path.basename(rawPath))
    : path.resolve(process.cwd(), rawPath);

  process.env.DATABASE_URL = `file:${dbPath}`;
}

normaliseSqliteDatabaseUrl();

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma: PrismaClient =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
