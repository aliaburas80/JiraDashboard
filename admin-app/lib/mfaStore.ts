import { prisma } from '../../src/lib/prisma';
import { decryptSecret, encryptSecret } from '../../src/lib/secret-field';
import {
  buildOtpAuthUri,
  generateRecoveryCodes,
  generateTotpSecret,
  hashRecoveryCode,
  normalizeRecoveryCode,
  verifyTotp,
} from './totp';

const MFA_KEY = 'admin_totp_v1';

interface AdminMfaRecord {
  version: 1;
  secretEncrypted: string;
  enabledAt: string | null;
  recoveryCodeHashes: string[];
  lastUsedCounter: number | null;
  updatedAt: string;
}

function ownerId(userId: string): string {
  return `admin:${userId}`;
}

function recoveryHashKey(): string {
  const key = process.env.CONFIG_ENCRYPTION_KEY;
  if (!key) throw new Error('CONFIG_ENCRYPTION_KEY is required for admin MFA.');
  return key;
}

function parseRecord(valueJson: string | null | undefined): AdminMfaRecord | null {
  if (!valueJson) return null;
  try {
    const parsed = JSON.parse(valueJson) as Partial<AdminMfaRecord>;
    if (parsed.version !== 1 || typeof parsed.secretEncrypted !== 'string') return null;
    return {
      version: 1,
      secretEncrypted: parsed.secretEncrypted,
      enabledAt: typeof parsed.enabledAt === 'string' ? parsed.enabledAt : null,
      recoveryCodeHashes: Array.isArray(parsed.recoveryCodeHashes)
        ? parsed.recoveryCodeHashes.filter((value): value is string => typeof value === 'string')
        : [],
      lastUsedCounter: typeof parsed.lastUsedCounter === 'number' ? parsed.lastUsedCounter : null,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date(0).toISOString(),
    };
  } catch {
    return null;
  }
}

async function loadRecord(userId: string): Promise<AdminMfaRecord | null> {
  const setting = await prisma.appSetting.findUnique({
    where: { ownerId_key: { ownerId: ownerId(userId), key: MFA_KEY } },
    select: { valueJson: true },
  });
  return parseRecord(setting?.valueJson);
}

async function saveRecord(userId: string, record: AdminMfaRecord): Promise<void> {
  const valueJson = JSON.stringify({ ...record, updatedAt: new Date().toISOString() });
  await prisma.appSetting.upsert({
    where: { ownerId_key: { ownerId: ownerId(userId), key: MFA_KEY } },
    create: { ownerId: ownerId(userId), key: MFA_KEY, valueJson, updatedBy: userId },
    update: { valueJson, updatedBy: userId },
  });
}

export async function getAdminMfaStatus(userId: string): Promise<{ enabled: boolean; recoveryCodesRemaining: number }> {
  const record = await loadRecord(userId);
  return {
    enabled: Boolean(record?.enabledAt),
    recoveryCodesRemaining: record?.recoveryCodeHashes.length ?? 0,
  };
}

export async function beginAdminMfaEnrollment(
  userId: string,
  email: string,
): Promise<{ secret: string; otpAuthUri: string; alreadyEnabled: boolean }> {
  const existing = await loadRecord(userId);
  if (existing?.enabledAt) {
    return { secret: '', otpAuthUri: '', alreadyEnabled: true };
  }

  const secret = existing?.secretEncrypted
    ? decryptSecret(existing.secretEncrypted)
    : generateTotpSecret();

  if (!existing?.secretEncrypted) {
    await saveRecord(userId, {
      version: 1,
      secretEncrypted: encryptSecret(secret),
      enabledAt: null,
      recoveryCodeHashes: [],
      lastUsedCounter: null,
      updatedAt: new Date().toISOString(),
    });
  }

  return {
    secret,
    otpAuthUri: buildOtpAuthUri(email, secret),
    alreadyEnabled: false,
  };
}

export async function confirmAdminMfaEnrollment(
  userId: string,
  token: string,
): Promise<{ ok: boolean; recoveryCodes?: string[] }> {
  const record = await loadRecord(userId);
  if (!record || record.enabledAt) return { ok: false };

  const secret = decryptSecret(record.secretEncrypted);
  const verified = verifyTotp(secret, token, { lastUsedCounter: record.lastUsedCounter });
  if (!verified.valid || verified.counter == null) return { ok: false };

  const recoveryCodes = generateRecoveryCodes();
  const key = recoveryHashKey();
  await saveRecord(userId, {
    ...record,
    enabledAt: new Date().toISOString(),
    lastUsedCounter: verified.counter,
    recoveryCodeHashes: recoveryCodes.map(code => hashRecoveryCode(code, key)),
  });

  return { ok: true, recoveryCodes };
}

export async function verifyAdminSecondFactor(
  userId: string,
  token: string,
): Promise<{ ok: boolean; method?: 'totp' | 'recovery'; recoveryCodesRemaining?: number }> {
  const record = await loadRecord(userId);
  if (!record?.enabledAt) return { ok: false };

  const secret = decryptSecret(record.secretEncrypted);
  const totp = verifyTotp(secret, token, { lastUsedCounter: record.lastUsedCounter });
  if (totp.valid && totp.counter != null) {
    await saveRecord(userId, { ...record, lastUsedCounter: totp.counter });
    return { ok: true, method: 'totp', recoveryCodesRemaining: record.recoveryCodeHashes.length };
  }

  const normalized = normalizeRecoveryCode(token);
  if (!normalized.startsWith('DC-')) return { ok: false };

  const key = recoveryHashKey();
  const candidateHash = hashRecoveryCode(normalized, key);
  const index = record.recoveryCodeHashes.findIndex(hash => hash === candidateHash);
  if (index < 0) return { ok: false };

  const remaining = record.recoveryCodeHashes.filter((_, currentIndex) => currentIndex !== index);
  await saveRecord(userId, { ...record, recoveryCodeHashes: remaining });
  return { ok: true, method: 'recovery', recoveryCodesRemaining: remaining.length };
}

export async function resetAdminMfa(userId: string): Promise<void> {
  await prisma.appSetting.deleteMany({
    where: { ownerId: ownerId(userId), key: MFA_KEY },
  });
}
