// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
//
// Production security check service.
// Evaluates server-side security conditions and returns a structured checklist.
// Server-only — never runs in the browser.

import fs   from 'fs';
import path from 'path';

export type CheckStatus = 'pass' | 'fail' | 'warn' | 'manual';
export type CheckSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface SecurityCheck {
  id:          string;
  category:    string;
  label:       string;
  description: string;
  status:      CheckStatus;
  severity:    CheckSeverity;
  detail:      string;
  fix?:        string;
  isAuto:      boolean;  // true = automatically evaluated; false = manual review needed
}

export interface SecurityReport {
  checks:       SecurityCheck[];
  passCount:    number;
  failCount:    number;
  warnCount:    number;
  manualCount:  number;
  criticalFails: number;
  overallScore:  number;  // 0–100
  isProductionReady: boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const DEFAULT_SECRET = 'delivery-clarity-change-this-in-production-32chars';
const DEFAULT_ADMIN_PW = 'Admin@DC2025';

function check(
  id: string, category: string, label: string, description: string,
  status: CheckStatus, severity: CheckSeverity, detail: string, fix?: string, isAuto = true,
): SecurityCheck {
  return { id, category, label, description, status, severity, detail, fix, isAuto };
}

// ── Automated checks ──────────────────────────────────────────────────────────

function checkSessionSecret(): SecurityCheck {
  const secret = process.env.SESSION_SECRET ?? '';
  const isDefault = secret === DEFAULT_SECRET || secret === '' || secret.length < 32;
  return check(
    'session_secret', 'Authentication',
    'SESSION_SECRET is set and strong',
    'The session encryption key must be a unique random string ≥ 32 characters.',
    isDefault ? 'fail' : 'pass',
    'critical',
    isDefault
      ? 'SESSION_SECRET is using the default or is too short. Any attacker can forge sessions.'
      : `SESSION_SECRET is set (${secret.length} chars).`,
    'Set SESSION_SECRET to a random 32+ character string in .env',
  );
}

function checkRegistrationLocked(): SecurityCheck {
  const open = process.env.ALLOW_OPEN_REGISTRATION === 'true';
  return check(
    'registration_locked', 'Access Control',
    'Open registration is disabled',
    'Registration should be locked to prevent unauthorized accounts.',
    open ? 'warn' : 'pass',
    'high',
    open
      ? 'ALLOW_OPEN_REGISTRATION=true — anyone can create an account.'
      : 'ALLOW_OPEN_REGISTRATION=false — registration is locked.',
    'Keep ALLOW_OPEN_REGISTRATION=false. Users are created through Admin Settings.',
  );
}

function checkNodeEnv(): SecurityCheck {
  const env = process.env.NODE_ENV ?? 'development';
  const isProd = env === 'production';
  return check(
    'node_env', 'Environment',
    'NODE_ENV is set to production',
    'Production mode enables secure cookies, disables debug output, and optimises performance.',
    isProd ? 'pass' : 'warn',
    'medium',
    isProd ? 'NODE_ENV=production' : `NODE_ENV=${env} — not running in production mode.`,
    'Set NODE_ENV=production in your deployment environment.',
  );
}

function checkSecureCookies(): SecurityCheck {
  const isProd = process.env.NODE_ENV === 'production';
  return check(
    'secure_cookies', 'Authentication',
    'Session cookies use Secure flag in production',
    'Session cookies should be marked Secure so they are only sent over HTTPS.',
    isProd ? 'pass' : 'warn',
    'high',
    isProd
      ? 'Secure flag is enabled (NODE_ENV=production).'
      : 'Secure flag disabled in development — ensure it is enabled in production.',
    'Deploy with NODE_ENV=production to enable secure cookies.',
  );
}

function checkDatabaseExists(): SecurityCheck {
  const dbPath = path.join(process.cwd(), 'data', 'delivery_clarity.db');
  const exists = fs.existsSync(dbPath);
  return check(
    'database_exists', 'Database',
    'SQLite database exists',
    'The database must be initialised before the app can store users, logs, and snapshots.',
    exists ? 'pass' : 'fail',
    'critical',
    exists ? 'Database found at data/delivery_clarity.db' : 'Database not found — run: npx prisma db push',
    'Run: npx prisma generate && npx prisma db push',
  );
}

function checkEnvFileNotExposed(): SecurityCheck {
  // Check .gitignore includes .env
  const gitignorePath = path.join(process.cwd(), '.gitignore');
  let protectsEnv = false;
  try {
    const content = fs.readFileSync(gitignorePath, 'utf-8');
    protectsEnv = content.includes('.env') || content.includes('.env.local');
  } catch {}
  return check(
    'env_gitignored', 'Secrets',
    '.env is excluded from version control',
    '.env files must never be committed to git as they contain secrets.',
    protectsEnv ? 'pass' : 'fail',
    'critical',
    protectsEnv ? '.gitignore includes .env patterns.' : '.env is NOT in .gitignore — secrets may be exposed in git.',
    'Add .env and .env.local to .gitignore immediately.',
  );
}

function checkRetentionConfigured(): SecurityCheck {
  const settingsPath = path.join(process.cwd(), 'data', 'retention-settings.json');
  const exists = fs.existsSync(settingsPath);
  let configured = false;
  if (exists) {
    try {
      const s = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
      configured = s.retentionDays !== -1 || s.autoDeleteOldLogs === true;
    } catch {}
  }
  return check(
    'retention_configured', 'Privacy',
    'Data retention policy is configured',
    'A retention policy ensures uploaded data is not kept indefinitely.',
    configured ? 'pass' : 'warn',
    'medium',
    configured ? 'Retention policy is configured.' : 'Retention is set to "Keep forever". Consider setting a retention period.',
    'Go to Admin → Privacy & Retention and configure a retention period.',
  );
}

function checkSessionTTL(): SecurityCheck {
  const ttl = Number(process.env.SESSION_TTL_HOURS ?? 8);
  const ok  = ttl > 0 && ttl <= 24;
  return check(
    'session_ttl', 'Authentication',
    'Session TTL is reasonable (1–24 hours)',
    'Sessions should expire to limit the window of exposure if a session is stolen.',
    ok ? 'pass' : 'warn',
    'medium',
    `SESSION_TTL_HOURS=${ttl} hour${ttl !== 1 ? 's' : ''}.${ttl > 24 ? ' This is longer than recommended.' : ''}`,
    'Set SESSION_TTL_HOURS to 8 or less for production.',
  );
}

// ── Manual checks (cannot be auto-verified) ───────────────────────────────────

function manualChecks(): SecurityCheck[] {
  return [
    check('admin_pw_changed', 'Access Control',
      'Admin password changed from default',
      'The default Admin@DC2025 password must be changed after first login.',
      'manual', 'critical',
      'Verify the admin account password has been changed from the default seed value.',
      'Login as admin → Profile → change password.',
      false),
    check('https_enabled', 'Transport',
      'HTTPS is enabled in production',
      'All traffic must be encrypted. Self-signed certificates are not acceptable for production.',
      'manual', 'critical',
      'Confirm your deployment uses a valid TLS certificate.',
      'Configure HTTPS via your reverse proxy (nginx/caddy) or cloud platform.',
      false),
    check('firewall_rules', 'Network',
      'Database port is not publicly exposed',
      'The SQLite file must be stored on the server filesystem, not a publicly accessible network share.',
      'manual', 'high',
      'Confirm data/delivery_clarity.db is only accessible to the application process.',
      'Check server file permissions: chmod 600 data/delivery_clarity.db',
      false),
    check('backup_scheduled', 'Backup',
      'Regular database backups are scheduled',
      'Use the Backup & Restore feature or an external cron job to take regular backups.',
      'manual', 'medium',
      'Confirm a backup schedule is in place — daily recommended for production.',
      'Admin → Backup & Restore → Download Backup. Schedule with cron or CI pipeline.',
      false),
    check('logs_monitored', 'Operations',
      'Application logs are monitored',
      'Server logs and audit events should be reviewed regularly for suspicious activity.',
      'manual', 'low',
      'Confirm audit logs at Admin → Backend are reviewed periodically.',
      'Review Admin → Backend regularly for failed logins, unusual activity.',
      false),
  ];
}

// ── Main export ───────────────────────────────────────────────────────────────

export function runSecurityChecks(): SecurityReport {
  const checks: SecurityCheck[] = [
    checkSessionSecret(),
    checkRegistrationLocked(),
    checkNodeEnv(),
    checkSecureCookies(),
    checkDatabaseExists(),
    checkEnvFileNotExposed(),
    checkRetentionConfigured(),
    checkSessionTTL(),
    ...manualChecks(),
  ];

  const passCount    = checks.filter(c => c.status === 'pass').length;
  const failCount    = checks.filter(c => c.status === 'fail').length;
  const warnCount    = checks.filter(c => c.status === 'warn').length;
  const manualCount  = checks.filter(c => c.status === 'manual').length;
  const criticalFails = checks.filter(c => c.status === 'fail' && c.severity === 'critical').length;

  // Score: auto checks only (manual = unknown)
  const autoChecks = checks.filter(c => c.isAuto);
  const autoPass   = autoChecks.filter(c => c.status === 'pass').length;
  const autoWarn   = autoChecks.filter(c => c.status === 'warn').length;
  const overallScore = autoChecks.length > 0
    ? Math.round(((autoPass + autoWarn * 0.5) / autoChecks.length) * 100)
    : 0;

  return {
    checks,
    passCount,
    failCount,
    warnCount,
    manualCount,
    criticalFails,
    overallScore,
    isProductionReady: criticalFails === 0 && failCount === 0,
  };
}
