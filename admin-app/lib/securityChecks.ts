export type AdminSecurityCheckStatus = 'pass' | 'fail' | 'warn' | 'manual';
export type AdminSecurityCheckSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface AdminSecurityCheck {
  id: string;
  category: string;
  label: string;
  description: string;
  status: AdminSecurityCheckStatus;
  severity: AdminSecurityCheckSeverity;
  detail: string;
  fix?: string;
  isAuto: boolean;
}

export interface AdminSecurityReport {
  checks: AdminSecurityCheck[];
  passCount: number;
  failCount: number;
  warnCount: number;
  manualCount: number;
  criticalFails: number;
  overallScore: number;
  isProductionReady: boolean;
}

function check(
  id: string,
  category: string,
  label: string,
  description: string,
  status: AdminSecurityCheckStatus,
  severity: AdminSecurityCheckSeverity,
  detail: string,
  fix?: string,
  isAuto = true,
): AdminSecurityCheck {
  return { id, category, label, description, status, severity, detail, fix, isAuto };
}

function secretCheck(name: string, value: string | undefined, category = 'Authentication'): AdminSecurityCheck {
  const strong = Boolean(value && value.length >= 32);
  return check(
    name.toLowerCase(),
    category,
    `${name} is set and strong`,
    `${name} must be a random secret of at least 32 characters.`,
    strong ? 'pass' : 'fail',
    'critical',
    strong ? `${name} is configured.` : `${name} is missing or shorter than 32 characters.`,
    `Set ${name} to a unique random 32+ character value in the Admin deployment environment.`,
  );
}

export function runAdminSecurityChecks(): AdminSecurityReport {
  const adminSecret = process.env.ADMIN_SESSION_SECRET;
  const userSecret = process.env.SESSION_SECRET;
  const secretsSeparated = Boolean(adminSecret && userSecret && adminSecret !== userSecret);
  const databaseConfigured = Boolean(process.env.DATABASE_URL?.trim());
  const adminUrlConfigured = Boolean(process.env.ADMIN_APP_URL?.trim());
  const production = process.env.NODE_ENV === 'production';
  const ttl = Number(process.env.ADMIN_SESSION_TTL_HOURS ?? 4);
  const ttlOk = Number.isFinite(ttl) && ttl > 0 && ttl <= 8;

  const checks: AdminSecurityCheck[] = [
    secretCheck('ADMIN_SESSION_SECRET', adminSecret),
    secretCheck('CONFIG_ENCRYPTION_KEY', process.env.CONFIG_ENCRYPTION_KEY, 'Secrets'),
    check(
      'admin_user_secret_separation',
      'Authentication',
      'Admin and user session secrets are different',
      'The Admin runtime must not share its session-encryption secret with the user-facing app.',
      secretsSeparated ? 'pass' : 'fail',
      'critical',
      secretsSeparated ? 'Admin and user sessions use distinct secrets.' : 'ADMIN_SESSION_SECRET is missing, SESSION_SECRET is missing, or both secrets are identical.',
      'Configure distinct random values for ADMIN_SESSION_SECRET and SESSION_SECRET.',
    ),
    check(
      'database_url',
      'Database',
      'PostgreSQL DATABASE_URL is configured',
      'The Admin runtime requires the shared PostgreSQL/Neon database connection.',
      databaseConfigured ? 'pass' : 'fail',
      'critical',
      databaseConfigured ? 'DATABASE_URL is configured.' : 'DATABASE_URL is missing.',
      'Set DATABASE_URL to the production PostgreSQL/Neon connection string.',
    ),
    check(
      'admin_app_url',
      'Deployment',
      'ADMIN_APP_URL is configured',
      'The user application uses ADMIN_APP_URL to retire and redirect its embedded /admin console.',
      adminUrlConfigured ? 'pass' : 'fail',
      'high',
      adminUrlConfigured ? 'ADMIN_APP_URL is configured.' : 'ADMIN_APP_URL is missing.',
      'Set ADMIN_APP_URL to the dedicated Admin application HTTPS origin.',
    ),
    check(
      'node_env',
      'Environment',
      'NODE_ENV is production',
      'Production mode enables secure Admin cookies and production runtime behavior.',
      production ? 'pass' : 'warn',
      'high',
      production ? 'NODE_ENV=production.' : `NODE_ENV=${process.env.NODE_ENV ?? 'development'}.`,
      'Deploy the Admin runtime with NODE_ENV=production.',
    ),
    check(
      'admin_session_ttl',
      'Authentication',
      'Admin session TTL is limited',
      'Privileged sessions should expire faster than ordinary user sessions.',
      ttlOk ? 'pass' : 'warn',
      'medium',
      `ADMIN_SESSION_TTL_HOURS=${ttl}.`,
      'Use an Admin session TTL between 1 and 8 hours; 4 hours is the default.',
    ),
    check(
      'open_registration',
      'Access Control',
      'Public registration state reviewed',
      'Open registration is a user-app decision but should be intentional before production exposure.',
      process.env.ALLOW_OPEN_REGISTRATION === 'true' ? 'warn' : 'pass',
      'medium',
      process.env.ALLOW_OPEN_REGISTRATION === 'true' ? 'ALLOW_OPEN_REGISTRATION=true.' : 'Open registration is disabled.',
      'Confirm the intended registration policy before launch.',
    ),
    check(
      'https',
      'Transport',
      'Dedicated Admin origin uses HTTPS',
      'Admin credentials, TOTP codes and recovery codes must only travel over TLS.',
      'manual',
      'critical',
      'Verify the deployed ADMIN_APP_URL uses a valid TLS certificate and HTTP redirects to HTTPS.',
      'Configure TLS at the hosting/reverse-proxy layer.',
      false,
    ),
    check(
      'database_network',
      'Network',
      'PostgreSQL is not publicly exposed beyond required trusted access',
      'The production database should use provider/network controls and encrypted connections.',
      'manual',
      'high',
      'Verify Neon/PostgreSQL connection policy, TLS and credential rotation outside the application.',
      'Restrict database credentials to the app deployments and rotate them on exposure.',
      false,
    ),
    check(
      'owner_mfa_recovery',
      'Authentication',
      'Owner Admin recovery material is stored securely',
      'Owner Admin recovery codes are the emergency access path if the authenticator is lost.',
      'manual',
      'high',
      'Verify recovery codes are stored offline in an approved secure location.',
      'Regenerate MFA enrollment through the controlled bootstrap recovery procedure if codes are lost.',
      false,
    ),
  ];

  const passCount = checks.filter(item => item.status === 'pass').length;
  const failCount = checks.filter(item => item.status === 'fail').length;
  const warnCount = checks.filter(item => item.status === 'warn').length;
  const manualCount = checks.filter(item => item.status === 'manual').length;
  const criticalFails = checks.filter(item => item.status === 'fail' && item.severity === 'critical').length;
  const auto = checks.filter(item => item.isAuto);
  const score = auto.length
    ? Math.round(((auto.filter(item => item.status === 'pass').length + auto.filter(item => item.status === 'warn').length * 0.5) / auto.length) * 100)
    : 0;

  return {
    checks,
    passCount,
    failCount,
    warnCount,
    manualCount,
    criticalFails,
    overallScore: score,
    isProductionReady: failCount === 0 && criticalFails === 0,
  };
}
