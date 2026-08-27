#!/usr/bin/env node

import { cp, mkdir, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const standaloneRoot = path.join(root, 'admin-app', '.next', 'standalone');
const adminNextRoot = path.join(root, 'admin-app', '.next');
const outputRoot = path.join(root, 'admin-hostinger');

async function exists(target) {
  try {
    await stat(target);
    return true;
  } catch {
    return false;
  }
}

async function findServerFiles(dir, relative = '') {
  const entries = await readdir(dir, { withFileTypes: true });
  const matches = [];

  for (const entry of entries) {
    const rel = path.join(relative, entry.name);
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      matches.push(...await findServerFiles(full, rel));
    } else if (entry.isFile() && entry.name === 'server.js') {
      matches.push(rel);
    }
  }

  return matches;
}

if (!await exists(standaloneRoot)) {
  throw new Error('Admin standalone output was not found. Run npm run admin:build first.');
}

const servers = await findServerFiles(standaloneRoot);
let appServer = servers.find(file => file === 'server.js');

if (!appServer) {
  appServer = servers.find(file => file.split(path.sep).includes('admin-app'));
}

if (!appServer && servers.length === 1) appServer = servers[0];

if (!appServer) {
  throw new Error(`Could not determine the Admin standalone server entry. Found: ${servers.join(', ') || 'none'}`);
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });
await cp(standaloneRoot, outputRoot, { recursive: true });

const appServerDir = path.dirname(appServer);
const runtimeAppRoot = appServerDir === '.' ? outputRoot : path.join(outputRoot, appServerDir);
const staticSource = path.join(adminNextRoot, 'static');
const staticTarget = path.join(runtimeAppRoot, '.next', 'static');

if (await exists(staticSource)) {
  await mkdir(path.dirname(staticTarget), { recursive: true });
  await cp(staticSource, staticTarget, { recursive: true });
}

const publicSource = path.join(root, 'admin-app', 'public');
const publicTarget = path.join(runtimeAppRoot, 'public');
if (await exists(publicSource)) {
  await cp(publicSource, publicTarget, { recursive: true });
}

const normalizedEntry = appServer.split(path.sep).join('/');
const wrapper = `'use strict';\n\nfunction required(name) {\n  const value = process.env[name]?.trim() || '';\n  if (!value) throw new Error(name + ' is required.');\n  return value;\n}\n\nconst databaseUrl = required('DATABASE_URL');\nconst adminSessionSecret = required('ADMIN_SESSION_SECRET');\nconst configEncryptionKey = required('CONFIG_ENCRYPTION_KEY');\nconst adminAppUrl = required('ADMIN_APP_URL');\nconst userSessionSecret = process.env.SESSION_SECRET?.trim() || '';\n\nif (databaseUrl.startsWith('file:')) throw new Error('DATABASE_URL must be PostgreSQL.');\nif (adminSessionSecret.length < 32) throw new Error('ADMIN_SESSION_SECRET must be at least 32 characters.');\nif (configEncryptionKey.length < 16) throw new Error('CONFIG_ENCRYPTION_KEY must be at least 16 characters.');\nif (configEncryptionKey.length < 32) console.warn(JSON.stringify({ level: 'warn', event: 'admin_startup.env_warning', warning: 'CONFIG_ENCRYPTION_KEY is a legacy short key. Keep it only for compatibility, then rotate it through a coordinated re-encryption procedure.' }));\nif (userSessionSecret && adminSessionSecret === userSessionSecret) throw new Error('ADMIN_SESSION_SECRET must differ from SESSION_SECRET.');\n\nconst parsed = new URL(adminAppUrl);\nconst isLocal = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);\nif (process.env.NODE_ENV === 'production' && !isLocal && parsed.protocol !== 'https:') {\n  throw new Error('ADMIN_APP_URL must use HTTPS in production.');\n}\n\nprocess.env.HOSTNAME ||= '0.0.0.0';\nrequire('./${normalizedEntry}');\n`;

if (appServer !== 'server.js') {
  await writeFile(path.join(outputRoot, 'server.js'), wrapper, 'utf8');
}

console.log(JSON.stringify({
  level: 'info',
  event: 'admin_hostinger_bundle.ready',
  output: path.relative(root, outputRoot),
  entry: appServer === 'server.js' ? 'server.js' : `server.js -> ${normalizedEntry}`,
}));
