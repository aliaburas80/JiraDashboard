// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Password hashing and verification.

import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

// EP-012: how long an email verification link stays valid after registration.
export const EMAIL_VERIFICATION_TTL_HOURS = 24;

// EP-013: how long a "forgot password" reset link stays valid — shorter than email
// verification since a leaked reset link grants immediate account takeover.
export const PASSWORD_RESET_TTL_HOURS = 1;

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
  return null;
}

// Generates a cryptographically random 14-character temp password that satisfies
// validatePasswordStrength (2 uppercase, 2 digits, 2 symbols, rest mixed).
export function generateTempPassword(): string {
  const upper   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower   = 'abcdefghijklmnopqrstuvwxyz';
  const digits  = '0123456789';
  const special = '!@#$%^&*';
  const all     = upper + lower + digits + special;

  const buf = randomBytes(32);
  let bi = 0;
  const rand = (n: number) => buf[bi++ % 32] % n;

  const chars: string[] = [
    upper[rand(upper.length)],
    upper[rand(upper.length)],
    digits[rand(digits.length)],
    digits[rand(digits.length)],
    special[rand(special.length)],
    special[rand(special.length)],
    ...Array.from({ length: 8 }, () => all[rand(all.length)]),
  ];

  for (let i = chars.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}

// Opaque, unguessable token embedded in an emailed link. Reused as-is for both the
// EP-012 email-verification link and the EP-013 password-reset link — same shape
// (32 random bytes, hex-encoded), different table columns and TTLs per caller.
export function generateVerificationToken(): string {
  return randomBytes(32).toString('hex');
}
