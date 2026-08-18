import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

const DUMMY_ADMIN_PASSWORD_HASH = bcrypt.hashSync('not-a-real-admin-account-password', 12);

export async function verifyAdminCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = normalizedEmail
    ? await prisma.user.findUnique({
        where: { email: normalizedEmail },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          isSuperAdmin: true,
          passwordHash: true,
        },
      })
    : null;

  const passwordHash = user?.passwordHash ?? DUMMY_ADMIN_PASSWORD_HASH;
  const passwordValid = await bcrypt.compare(password, passwordHash);

  if (!user || !passwordValid || !user.isActive || user.role !== 'admin') return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isSuperAdmin: user.isSuperAdmin,
  };
}

export async function isAdminLoginRateLimited(ip: string): Promise<boolean> {
  const key = `admin-login:${ip}`;
  const windowStart = new Date(Date.now() - 60_000);
  const prunePoint = new Date(Date.now() - 10 * 60_000);

  const [count] = await Promise.all([
    prisma.loginAttempt.count({ where: { ip: key, attemptedAt: { gte: windowStart } } }),
    prisma.loginAttempt.deleteMany({ where: { ip: key, attemptedAt: { lt: prunePoint } } }),
  ]);

  if (count >= 5) return true;
  await prisma.loginAttempt.create({ data: { ip: key } });
  return false;
}

export async function safeAdminAudit(data: {
  userId?: string;
  eventType: string;
  eventDescription: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    await prisma.auditEvent.create({ data });
  } catch (error) {
    console.error('[admin-audit] unable to persist audit event', error);
  }
}
