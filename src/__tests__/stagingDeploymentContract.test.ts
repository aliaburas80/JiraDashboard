import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function repoFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('EP-028 staging deployment contract', () => {
  const verifier = repoFile('scripts/verify-staging.mjs');
  const workflow = repoFile('.github/workflows/staging-smoke.yml');

  test('verifies both runtimes and the production security boundaries', () => {
    expect(verifier).toContain('/api/health');
    expect(verifier).toContain('/api/ready');
    expect(verifier).toContain('/api/admin/users');
    expect(verifier).toContain('/admin/settings');
    expect(verifier).toContain('/api/auth/me');
    expect(verifier).toContain("'delivery-clarity-admin'");
    expect(verifier).toContain("'https://deliveryclarity.app'");
    expect(verifier).toContain('Refusing to treat production origin');
  });

  test('keeps staging verification manual, URL-driven, and evidence-producing', () => {
    expect(workflow).toContain('workflow_dispatch:');
    expect(workflow).toContain('user_app_url:');
    expect(workflow).toContain('admin_app_url:');
    expect(workflow).toContain('node scripts/verify-staging.mjs --report staging-verification.json');
    expect(workflow).toContain('ep-028-staging-verification');
    expect(workflow).not.toContain('ADMIN_PASSWORD');
    expect(workflow).not.toContain('OWNER_ADMIN_PASSWORD');
  });
});
