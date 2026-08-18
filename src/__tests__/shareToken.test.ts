import { generateShareToken, hashShareToken } from '@/lib/shareToken';

describe('share token security', () => {
  it('generates high-entropy URL-safe tokens and stores only deterministic hashes', () => {
    const token = generateShareToken();
    expect(token).toMatch(/^[A-Za-z0-9_-]{40,60}$/);
    const hash = hashShareToken(token);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toContain(token);
    expect(hashShareToken(token)).toBe(hash);
  });
});
