import fs from 'fs';
import path from 'path';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('EP-024 separate Admin operational boundary', () => {
  test('organization operational APIs require a fully MFA-authenticated Admin session', () => {
    const routes = [
      'admin-app/app/api/ops/users/route.ts',
      'admin-app/app/api/ops/users/[id]/reset-preview/route.ts',
      'admin-app/app/api/ops/users/[id]/reset/route.ts',
      'admin-app/app/api/ops/audit/route.ts',
      'admin-app/app/api/ops/feedback/route.ts',
    ];

    for (const route of routes) {
      const text = source(route);
      expect(text).toContain('requireFullyAuthenticatedAdmin');
      expect(text).not.toContain('SESSION_OPTIONS');
      expect(text).not.toContain("cookieName: 'dc_session'");
    }
  });

  test('deployment-wide operational APIs require Owner Admin', () => {
    const routes = [
      'admin-app/app/api/ops/system-errors/route.ts',
      'admin-app/app/api/ops/diagnostics/route.ts',
      'admin-app/app/api/ops/security/route.ts',
      'admin-app/app/api/ops/settings/app-config/route.ts',
    ];

    for (const route of routes) {
      const text = source(route);
      expect(text).toContain('requireOwnerAdmin');
      expect(text).not.toContain('SESSION_OPTIONS');
    }
  });

  test('Owner-only pages are rejected in middleware before their UI renders', () => {
    const proxy = source('admin-app/proxy.ts');
    expect(proxy).toContain('OWNER_ONLY_PATHS');
    expect(proxy).toContain("'/system-errors'");
    expect(proxy).toContain("'/diagnostics'");
    expect(proxy).toContain("'/security'");
    expect(proxy).toContain("'/settings'");
    expect(proxy).toContain('!session.isSuperAdmin');
    expect(proxy).toContain("status: 403");
  });

  test('organization-scoped database access stays inside the tenancy boundary', () => {
    const repository = source('src/server/tenancy/adminOperationalRepository.ts');
    const usersRoute = source('admin-app/app/api/ops/users/route.ts');
    const auditRoute = source('admin-app/app/api/ops/audit/route.ts');

    expect(repository).toContain('organizationId');
    expect(usersRoute).toContain('adminOperationalRepository');
    expect(auditRoute).toContain('adminOperationalRepository');
    expect(usersRoute).not.toContain('prisma.user');
    expect(auditRoute).not.toContain('prisma.auditEvent');
  });

  test('embedded user-app Admin console redirects to the separate Admin origin and fails closed if runtime config is missing', () => {
    const legacyLayout = source('app/admin/layout.tsx');
    expect(legacyLayout).toContain('ADMIN_APP_URL');
    expect(legacyLayout).toContain('redirect(separateAdminUrl())');
    expect(legacyLayout).toContain("'/login?adminUnavailable=1'");
    expect(legacyLayout).not.toContain('AdminNavSidebar');
    expect(legacyLayout).not.toContain('DashboardTopbar');
  });

  test('migrated user-app Admin APIs cannot bypass separate Admin MFA', () => {
    const proxy = source('proxy.ts');
    const migrated = [
      '/api/admin/users',
      '/api/admin/audit-events',
      '/api/admin/feedback',
      '/api/admin/system-errors',
      '/api/admin/diagnostics',
      '/api/admin/security',
      '/api/admin/app-config',
    ];
    expect(proxy).toContain('MIGRATED_LEGACY_ADMIN_API');
    expect(proxy).toContain('isMigratedLegacyAdminApi(pathname)');
    expect(proxy).toContain('status: 410');
    for (const pathName of migrated) expect(proxy).toContain(`'${pathName}'`);
  });

  test('separate Admin navigation exposes migrated operations', () => {
    const layout = source('admin-app/app/(operations)/layout.tsx');
    for (const pathName of [
      '/users',
      '/audit',
      '/feedback',
      '/system-errors',
      '/diagnostics',
      '/security',
      '/settings',
    ]) {
      expect(layout).toContain(`href: '${pathName}'`);
    }
    expect(layout).toContain('session.isSuperAdmin');
  });
});
