import { createHmac, randomBytes, timingSafeEqual } from 'crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function encodeBase32(input: Buffer): string {
  let bits = '';
  for (const byte of input) bits += byte.toString(2).padStart(8, '0');

  let output = '';
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5).padEnd(5, '0');
    output += BASE32_ALPHABET[Number.parseInt(chunk, 2)];
  }
  return output;
}

export function decodeBase32(value: string): Buffer {
  const normalized = value.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (const char of normalized) {
    const index = BASE32_ALPHABET.indexOf(char);
    if (index < 0) throw new Error('Invalid Base32 value.');
    bits += index.toString(2).padStart(5, '0');
  }

  const bytes: number[] = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(Number.parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

export function generateTotpSecret(byteLength = 20): string {
  return encodeBase32(randomBytes(byteLength));
}

function hotp(secret: string, counter: number, digits: number): string {
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac('sha1', decodeBase32(secret)).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary =
    ((digest[offset] & 0x7f) << 24) |
    ((digest[offset + 1] & 0xff) << 16) |
    ((digest[offset + 2] & 0xff) << 8) |
    (digest[offset + 3] & 0xff);
  return String(binary % (10 ** digits)).padStart(digits, '0');
}

export function totpAt(
  secret: string,
  nowMs = Date.now(),
  options: { digits?: number; periodSeconds?: number } = {},
): { code: string; counter: number } {
  const digits = options.digits ?? 6;
  const periodSeconds = options.periodSeconds ?? 30;
  const counter = Math.floor(nowMs / 1000 / periodSeconds);
  return { code: hotp(secret, counter, digits), counter };
}

function safeCodeEquals(actual: string, expected: string): boolean {
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(actual), Buffer.from(expected));
}

export function verifyTotp(
  secret: string,
  token: string,
  options: {
    nowMs?: number;
    window?: number;
    digits?: number;
    periodSeconds?: number;
    lastUsedCounter?: number | null;
  } = {},
): { valid: boolean; counter?: number } {
  const digits = options.digits ?? 6;
  const periodSeconds = options.periodSeconds ?? 30;
  const window = options.window ?? 1;
  const cleaned = token.replace(/\s+/g, '');
  if (!new RegExp(`^\\d{${digits}}$`).test(cleaned)) return { valid: false };

  const currentCounter = Math.floor((options.nowMs ?? Date.now()) / 1000 / periodSeconds);
  for (let offset = -window; offset <= window; offset += 1) {
    const counter = currentCounter + offset;
    if (counter < 0) continue;
    if (options.lastUsedCounter != null && counter <= options.lastUsedCounter) continue;
    if (safeCodeEquals(cleaned, hotp(secret, counter, digits))) return { valid: true, counter };
  }
  return { valid: false };
}

export function buildOtpAuthUri(email: string, secret: string): string {
  const issuer = 'Delivery Clarity Admin';
  const label = `${issuer}:${email}`;
  return `otpauth://totp/${encodeURIComponent(label)}?secret=${encodeURIComponent(secret)}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

export function generateRecoveryCodes(count = 8): string[] {
  return Array.from({ length: count }, () => {
    const raw = randomBytes(8).toString('hex').toUpperCase();
    return `DC-${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12, 16)}`;
  });
}

export function normalizeRecoveryCode(code: string): string {
  return code.trim().toUpperCase().replace(/\s+/g, '');
}

export function hashRecoveryCode(code: string, key: string): string {
  return createHmac('sha256', key).update(normalizeRecoveryCode(code)).digest('hex');
}
