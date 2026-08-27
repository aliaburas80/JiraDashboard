#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import process from 'node:process';

const target = (process.env.DEPLOY_TARGET ?? '').trim().toLowerCase();
const script = target === 'admin' ? 'admin:hostinger:build' : 'build:app';

console.log(JSON.stringify({ level: 'info', event: 'build_router.select', target: target || 'app', script }));

const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const result = spawnSync(npmCmd, ['run', script], {
  stdio: 'inherit',
  env: process.env,
});

if (result.error) {
  console.error(JSON.stringify({ level: 'error', event: 'build_router.spawn_failed', error: result.error.message }));
  process.exit(1);
}

process.exit(result.status ?? 1);
