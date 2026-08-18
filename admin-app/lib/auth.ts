import bcrypt from 'bcryptjs';
import { prisma } from '../../src/lib/prisma';
import {
  createAdminBoundaryAudit,
  findAdminIdentityByEmail,
} from '../../src/server/tenancy/adminIdentityRepository';

const DUMMY_ADMIN_PASSWORD_HASH = bcrypt.hashSync('not-a-real-admin-account-password', 12);

export async function verifyAdminCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = normalizedEmail ? await findAdminIdentityByEmail(normalizedEmail) : null;

  const passwordHash = user?.passwordHash ?? DUMMY_ADMIN_PASSWORD_HASH;
  const passwordValid = await bcrypt.compare(password, passwordHash);

  if (!user || !passwordValid || !user.isActive || user.role !== 'admin') return null;

  return {
    id: user.id,
    organizationId: user.organizationId,
    email: user.email,
    name: user.name,
    isSuperAdmin: user.isSuperAdmin,
  };
}

async function isRateLimited(key: string, maxAttempts: number): Promise<boolean> {
  const windowStart = new Date(Date.now() - 60_000);
  const prunePoint = new Date(Date.now() - 10 * 60_000);

  const [count] = await Promise.all([
    prisma.loginAttempt.count({ where: { ip: key, attemptedAt: { gte: windowStart } } }),
    prisma.loginAttempt.deleteMany({ where: { ip: key, attemptedAt: { lt: prunePoint } } }),
  ]);

  if (count >= maxAttempts) return true;
  await prisma.loginAttempt.create({ data: { ip: key } });
  return false;
}

export async function isAdminLoginRateLimited(ip: string): Promise<boolean> {
  return isRateLimited(`admin-login:${ip}`, 5);
}

export async function isAdminMfaRateLimited(userId: string, ip: string): Promise<boolean> {
  return isRateLimited(`admin-mfa:${userId}:${ip}`, 8);
}

export async function safeAdminAudit(data: {
  organizationId?: string | null;
  userId?: string;
  eventType: string;
  eventDescription: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    await createAdminBoundaryAudit(data);
  } catch (error) {
    console.error('[admin-audit] unable to persist audit event', error);
  }
}
