#!/usr/bin/env node
// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Hosted production entrypoint: validate env, deploy migrations, then start Next.

import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const require = createRequire(import.meta.url);

const SECRET_KEY_PATTERN = /(secret|password|token|database_url|access_key|secret_key|cookie|authorization)/i;
const ENV_FILE_ORDER = ['.env.production.local', '.env.local', '.env.production', '.env'];

function log(level, event, context = {}) {
  const safeContext = Object.fromEntries(
    Object.entries(context).map(([key, value]) => [
      key,
      SECRET_KEY_PATTERN.test(key) ? '[redacted]' : value,
    ]),
  );
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    event,
    ...safeContext,
  });

  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

function requireEnv(name, errors) {
  const value = process.env[name]?.trim();
  if (!value) errors.push(`${name} is required in production.`);
  return value ?? '';
}

function unquoteEnvValue(value) {
  const trimmed = value.trim();
  const quote = trimmed[0];
  if ((quote === '"' || quote === "'") && trimmed.endsWith(quote)) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseEnvLine(line) {
  const normalized = line.trim();
  if (!normalized || normalized.startsWith('#')) return null;

  const assignment = normalized.startsWith('export ')
    ? normalized.slice('export '.length).trim()
    : normalized;
  const separatorIndex = assignment.indexOf('=');
  if (separatorIndex <= 0) return null;

  const key = assignment.slice(0, separatorIndex).trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) return null;

  return {
    key,
    value: unquoteEnvValue(assignment.slice(separatorIndex + 1)),
  };
}

function loadEnvFiles() {
  for (const fileName of ENV_FILE_ORDER) {
    const filePath = join(process.cwd(), fileName);
    if (!existsSync(filePath)) continue;

    const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const parsed = parseEnvLine(line);
      if (!parsed) continue;
      if (process.env[parsed.key] !== undefined) continue;
      process.env[parsed.key] = parsed.value;
    }
  }
}

function validateEnvironment() {
  const errors = [];
  const databaseUrl = requireEnv('DATABASE_URL', errors);
  const sessionSecret = requireEnv('SESSION_SECRET', errors);
  const configEncryptionKey = requireEnv('CONFIG_ENCRYPTION_KEY', errors);
  const storageDriver = process.env.STORAGE_DRIVER?.trim() || 'temporary';

  if (databaseUrl.startsWith('file:')) {
    errors.push('DATABASE_URL must be a PostgreSQL connection string in production.');
  }
  if (sessionSecret && sessionSecret.length < 32) {
    errors.push('SESSION_SECRET must be at least 32 characters.');
  }
  if (configEncryptionKey && configEncryptionKey.length < 32) {
    errors.push('CONFIG_ENCRYPTION_KEY must be at least 32 characters.');
  }
  if (!['s3', 'azure', 'gcp'].includes(storageDriver)) {
    errors.push('STORAGE_DRIVER must be s3, azure, or gcp in production.');
  }
  if (storageDriver === 's3') {
    requireEnv('STORAGE_BUCKET', errors);
    requireEnv('STORAGE_REGION', errors);
    const hasStorageCredentials = !!(
      process.env.STORAGE_ACCESS_KEY_ID?.trim() &&
      process.env.STORAGE_SECRET_ACCESS_KEY?.trim()
    );
    const hasAwsCredentials = !!(
      process.env.AWS_ACCESS_KEY_ID?.trim() &&
      process.env.AWS_SECRET_ACCESS_KEY?.trim()
    );
    if (!hasStorageCredentials && !hasAwsCredentials) {
      errors.push(
        'S3 storage requires STORAGE_ACCESS_KEY_ID/STORAGE_SECRET_ACCESS_KEY or AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY in production.',
      );
    }
  }

  if (errors.length > 0) {
    for (const error of errors) log('error', 'startup.env_invalid', { error });
    process.exit(1);
  }
}

function runNodeScript(scriptPath, args, eventName) {
  return new Promise((resolve, reject) => {
    log('info', `${eventName}.start`);
    const child = spawn(process.execPath, [scriptPath, ...args], {
      stdio: 'inherit',
      env: process.env,
    });

    child.on('exit', (code, signal) => {
      if (signal) {
        reject(new Error(`${eventName} terminated by ${signal}`));
      } else if (code === 0) {
        log('info', `${eventName}.success`);
        resolve();
      } else {
        reject(new Error(`${eventName} failed with exit code ${code}`));
      }
    });
  });
}

loadEnvFiles();
validateEnvironment();

const prismaBin = require.resolve('prisma/build/index.js');
const nextBin = require.resolve('next/dist/bin/next');
const port = process.env.PORT?.trim() || '3000';

try {
  await runNodeScript(prismaBin, ['migrate', 'deploy'], 'prisma_migrate_deploy');
} catch (error) {
  log('error', 'startup.migration_failed', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
}

log('info', 'next_start.start', { host: '0.0.0.0', port });
const next = spawn(process.execPath, [nextBin, 'start', '--hostname', '0.0.0.0', '--port', port], {
  stdio: 'inherit',
  env: { ...process.env, PORT: port },
});

function forwardSignal(signal) {
  log('info', 'shutdown.signal_received', { signal });
  next.kill(signal);
}

process.on('SIGTERM', () => forwardSignal('SIGTERM'));
process.on('SIGINT', () => forwardSignal('SIGINT'));

next.on('exit', (code, signal) => {
  log('info', 'next_start.exit', { code: code ?? null, signal: signal ?? null });
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
