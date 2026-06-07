// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Prepare local Next.js standalone runtime assets before `npm start`.

import fs from 'fs';
import path from 'path';

const root = process.cwd();
const nextDir = path.join(root, '.next');
const standaloneDir = path.join(nextDir, 'standalone');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
}

function copyFile(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

if (!fs.existsSync(path.join(standaloneDir, 'server.js'))) {
  console.error('Standalone server not found. Run `npm run build` before `npm start`.');
  process.exit(1);
}

copyDir(path.join(nextDir, 'server'), path.join(standaloneDir, '.next', 'server'));
copyDir(path.join(nextDir, 'static'), path.join(standaloneDir, '.next', 'static'));
copyDir(path.join(root, 'public'), path.join(standaloneDir, 'public'));

for (const manifest of [
  'BUILD_ID',
  'app-build-manifest.json',
  'build-manifest.json',
  'fallback-build-manifest.json',
  'images-manifest.json',
  'prerender-manifest.json',
  'react-loadable-manifest.json',
  'required-server-files.json',
  'routes-manifest.json',
]) {
  copyFile(path.join(nextDir, manifest), path.join(standaloneDir, '.next', manifest));
}
