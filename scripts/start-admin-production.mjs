#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import process from 'node:process';

const require = createRequire(import.meta.url);
const errors = [];

function required(name) {
  const value = process.env[name]?.trim() ?? '';
  if (!value) errors.push(`${name} is required.`);
  return value;
}

const databaseUrl = required('DATABASE_URL');
const adminSessionSecret = required('ADMIN_SESSION_SECRET');
const configEncryptionKey = required('CONFIG_ENCRYPTION_KEY');
const adminAppUrl = required('ADMIN_APP_URL');
const userSessionSecret = process.env.SESSION_SECRET?.trim() ?? '';

if (databaseUrl.startsWith('file:')) errors.push('DATABASE_URL must be PostgreSQL.');
if (adminSessionSecret && adminSessionSecret.length < 32) errors.push('ADMIN_SESSION_SECRET must be at least 32 characters.');
if (configEncryptionKey && configEncryptionKey.length < 32) errors.push('CONFIG_ENCRYPTION_KEY must be at least 32 characters.');
if (userSessionSecret && adminSessionSecret === userSessionSecret) errors.push('ADMIN_SESSION_SECRET must differ from SESSION_SECRET.');

if (adminAppUrl) {
  try {
    const parsed = new URL(adminAppUrl);
    const isLocal = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
    if (process.env.NODE_ENV === 'production' && !isLocal && parsed.protocol !== 'https:') {
      errors.push('ADMIN_APP_URL must use HTTPS in production.');
    }
  } catch {
    errors.push('ADMIN_APP_URL must be a valid absolute URL.');
  }
}

if (errors.length) {
  for (const error of errors) console.error(JSON.stringify({ level: 'error', event: 'admin_startup.env_invalid', error }));
  process.exit(1);
}

const prismaBin = require.resolve('prisma/build/index.js');
const nextBin = require.resolve('next/dist/bin/next');
const port = process.env.PORT?.trim() || '3001';

function run(command, args, event) {
  return new Promise((resolve, reject) => {
    console.log(JSON.stringify({ level: 'info', event: `${event}.start` }));
    const child = spawn(process.execPath, [command, ...args], { stdio: 'inherit', env: process.env });
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(`${event} failed with exit code ${code}`)));
    child.once('error', reject);
  });
}

try {
  await run(prismaBin, ['migrate', 'deploy'], 'admin_prisma_migrate_deploy');
} catch (error) {
  console.error(JSON.stringify({ level: 'error', event: 'admin_startup.migration_failed', error: error instanceof Error ? error.message : String(error) }));
  process.exit(1);
}

console.log(JSON.stringify({ level: 'info', event: 'admin_next_start.start', host: '0.0.0.0', port }));
const next = spawn(process.execPath, [nextBin, 'start', 'admin-app', '--hostname', '0.0.0.0', '--port', port], {
  stdio: 'inherit',
  env: { ...process.env, PORT: port },
});

for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => next.kill(signal));
}

next.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 0);
});
