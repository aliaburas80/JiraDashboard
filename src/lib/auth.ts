// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
// Password hashing and verification.
// Activate after: npm install bcryptjs && npm install --save-dev @types/bcryptjs

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const bcrypt = require('bcryptjs') as { hash: (p: string, r: number) => Promise<string> };
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const bcrypt = require('bcryptjs') as { compare: (p: string, h: string) => Promise<boolean> };
  return bcrypt.compare(password, hash);
}

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.';
  if (!/[0-9]/.test(password)) return 'Password must contain at least one number.';
  return null;
}
