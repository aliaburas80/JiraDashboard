// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Password hashing and verification.

import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

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
