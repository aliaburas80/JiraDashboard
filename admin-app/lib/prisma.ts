import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { dcAdminPrisma?: PrismaClient };

export const prisma = globalForPrisma.dcAdminPrisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.dcAdminPrisma = prisma;
