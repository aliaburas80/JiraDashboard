#!/usr/bin/env node
// EP-004: produce deterministic npm audit evidence without exposing secrets.
import { spawnSync } from 'node:child_process';

const result = spawnSync('npm', ['audit', '--json'], {
  encoding: 'utf8',
  maxBuffer: 20 * 1024 * 1024,
});

const raw = result.stdout || result.stderr || '{}';
let report;
try {
  report = JSON.parse(raw);
} catch {
  console.error('npm audit did not return valid JSON.');
  console.error(raw.slice(0, 4000));
  process.exit(2);
}

const metadata = report.metadata?.vulnerabilities ?? {};
const vulnerabilities = report.vulnerabilities ?? {};

const rows = Object.entries(vulnerabilities)
  .map(([name, item]) => ({
    name,
    severity: item.severity ?? 'unknown',
    direct: Boolean(item.isDirect),
    via: Array.isArray(item.via)
      ? item.via.map(v => typeof v === 'string' ? v : `${v.source ?? 'advisory'}:${v.title ?? 'unknown'}`).join(' | ')
      : String(item.via ?? ''),
    range: item.range ?? '',
    fixAvailable: item.fixAvailable === true
      ? 'yes'
      : item.fixAvailable === false
        ? 'no'
        : item.fixAvailable
          ? `${item.fixAvailable.name ?? name}@${item.fixAvailable.version ?? '?'}${item.fixAvailable.isSemVerMajor ? ' (major)' : ''}`
          : 'unknown',
  }))
  .sort((a, b) => a.severity.localeCompare(b.severity) || a.name.localeCompare(b.name));

console.log('EP-004 npm audit summary');
console.log(JSON.stringify(metadata, null, 2));
for (const row of rows) {
  console.log(`- ${row.severity.toUpperCase()} ${row.name} direct=${row.direct} range=${row.range} fix=${row.fixAvailable}`);
  if (row.via) console.log(`  via: ${row.via}`);
}

const high = Number(metadata.high ?? 0);
const critical = Number(metadata.critical ?? 0);
if (high > 0 || critical > 0) {
  console.error(`EP-004 gate failed: high=${high}, critical=${critical}`);
  process.exit(1);
}

console.log(`EP-004 gate passed: high=${high}, critical=${critical}`);
