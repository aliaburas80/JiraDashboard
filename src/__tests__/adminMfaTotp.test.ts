import {
  hashRecoveryCode,
  normalizeRecoveryCode,
  totpAt,
  verifyTotp,
} from '../../admin-app/lib/totp';

describe('EP-023 admin TOTP MFA', () => {
  const rfcSecret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

  test('matches the RFC 6238 SHA1 vector', () => {
    expect(totpAt(rfcSecret, 59_000, { digits: 8 }).code).toBe('94287082');
  });

  test('accepts a current code and rejects replay of the same counter', () => {
    const nowMs = 1_780_000_000_000;
    const current = totpAt(rfcSecret, nowMs);

    expect(verifyTotp(rfcSecret, current.code, { nowMs })).toEqual({
      valid: true,
      counter: current.counter,
    });
    expect(verifyTotp(rfcSecret, current.code, {
      nowMs,
      lastUsedCounter: current.counter,
    })).toEqual({ valid: false });
  });

  test('allows one clock step of drift', () => {
    const nowMs = 1_780_000_000_000;
    const previous = totpAt(rfcSecret, nowMs - 30_000);
    expect(verifyTotp(rfcSecret, previous.code, { nowMs, window: 1 }).valid).toBe(true);
  });

  test('normalizes recovery codes before hashing', () => {
    const key = 'test-recovery-hash-key';
    const canonical = 'DC-ABCD-EF01-2345-6789';
    expect(normalizeRecoveryCode('  dc-abcd-ef01-2345-6789  ')).toBe(canonical);
    expect(hashRecoveryCode(canonical, key)).toBe(hashRecoveryCode('dc-abcd-ef01-2345-6789', key));
  });
});
