import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const MFA_KEY = 'admin_totp_v1';

function fail(message) {
  console.error(`[owner-admin] ${message}`);
  process.exitCode = 1;
}

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function validateStrongPassword(password) {
  if (password.length < 14) return 'Password must be at least 14 characters.';
  if (!/[a-z]/.test(password)) return 'Password must include a lowercase letter.';
  if (!/[A-Z]/.test(password)) return 'Password must include an uppercase letter.';
  if (!/\d/.test(password)) return 'Password must include a number.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Password must include a symbol.';
  return null;
}

async function resetMfa(email) {
  const owner = await prisma.user.findUnique({ where: { email } });
  if (!owner || !owner.isSuperAdmin || owner.role !== 'admin') {
    throw new Error('The configured OWNER_ADMIN_EMAIL is not the current Owner Admin.');
  }

  await prisma.$transaction([
    prisma.appSetting.deleteMany({
      where: { ownerId: `admin:${owner.id}`, key: MFA_KEY },
    }),
    prisma.auditEvent.create({
      data: {
        organizationId: owner.organizationId ?? null,
        userId: owner.id,
        eventType: 'owner_admin_mfa_reset',
        eventDescription: `${owner.email} MFA enrollment was reset through the Owner Admin bootstrap CLI.`,
      },
    }),
  ]);

  console.log(`[owner-admin] MFA reset for ${owner.email}. The next Admin-console sign-in will require fresh enrollment.`);
}

async function bootstrapOwnerAdmin() {
  const email = required('OWNER_ADMIN_EMAIL').toLowerCase();
  const resetOnly = process.argv.includes('--reset-mfa');
  if (resetOnly) {
    await resetMfa(email);
    return;
  }

  const name = required('OWNER_ADMIN_NAME');
  const promoteExisting = process.env.OWNER_ADMIN_PROMOTE_EXISTING === 'true';
  const rotatePassword = process.env.OWNER_ADMIN_ROTATE_PASSWORD === 'true';
  const existingOwners = await prisma.user.findMany({
    where: { isSuperAdmin: true },
    select: { id: true, email: true },
  });

  if (existingOwners.length > 1) {
    throw new Error('Multiple Owner Admin records already exist. Resolve this manually before bootstrap can continue.');
  }
  if (existingOwners.length === 1 && existingOwners[0].email.toLowerCase() !== email) {
    throw new Error(`Owner Admin already exists as ${existingOwners[0].email}; refusing to create a second owner.`);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  const needsPassword = !existing || rotatePassword || (existing && !existing.isSuperAdmin && promoteExisting);
  let passwordHash;

  if (needsPassword) {
    const password = required('OWNER_ADMIN_PASSWORD');
    const passwordError = validateStrongPassword(password);
    if (passwordError) throw new Error(passwordError);
    passwordHash = await bcrypt.hash(password, 12);
  }

  if (existing?.isSuperAdmin) {
    const owner = await prisma.user.update({
      where: { id: existing.id },
      data: {
        name,
        role: 'admin',
        isSuperAdmin: true,
        isActive: true,
        emailVerified: true,
        mustChangePassword: false,
        ...(passwordHash ? { passwordHash } : {}),
      },
    });
    await prisma.auditEvent.create({
      data: {
        organizationId: owner.organizationId ?? null,
        userId: owner.id,
        eventType: 'owner_admin_bootstrap_verified',
        eventDescription: `${owner.email} Owner Admin bootstrap was verified${passwordHash ? ' and the password was rotated' : ''}.`,
      },
    });
    console.log(`[owner-admin] Owner Admin verified: ${owner.email}.`);
    return;
  }

  if (existing && !promoteExisting) {
    throw new Error('A non-owner account already uses OWNER_ADMIN_EMAIL. Set OWNER_ADMIN_PROMOTE_EXISTING=true only if that promotion is intentional.');
  }

  if (existing && promoteExisting) {
    const owner = await prisma.user.update({
      where: { id: existing.id },
      data: {
        name,
        passwordHash,
        role: 'admin',
        isSuperAdmin: true,
        isActive: true,
        emailVerified: true,
        mustChangePassword: false,
      },
    });
    await prisma.auditEvent.create({
      data: {
        organizationId: owner.organizationId ?? null,
        userId: owner.id,
        eventType: 'owner_admin_promoted',
        eventDescription: `${owner.email} was explicitly promoted to Owner Admin by the bootstrap CLI.`,
      },
    });
    console.log(`[owner-admin] Existing account promoted to Owner Admin: ${owner.email}.`);
    return;
  }

  const owner = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: 'admin',
      isSuperAdmin: true,
      isActive: true,
      emailVerified: true,
      mustChangePassword: false,
      persona: 'Owner Admin',
    },
  });
  await prisma.auditEvent.create({
    data: {
      organizationId: owner.organizationId ?? null,
      userId: owner.id,
      eventType: 'owner_admin_bootstrapped',
      eventDescription: `${owner.email} was created as the Owner Admin by the bootstrap CLI.`,
    },
  });
  console.log(`[owner-admin] Owner Admin created: ${owner.email}. MFA enrollment is required on first Admin-console sign-in.`);
}

try {
  await bootstrapOwnerAdmin();
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
} finally {
  await prisma.$disconnect();
}
