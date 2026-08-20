# EP-004 — Security Remediation

**Status:** In progress — remediation complete, final regression running  
**Phase:** Final pre-launch security round  
**Started from:** `main` commit `cc0473a41b716afc0536f07014a9fe7c710c69ee`

## Goal

Remove known npm dependency vulnerabilities before MVP go/no-go without broad, speculative upgrades.

The original EP-004 plan included a Next.js runtime upgrade. By the time this deferred packet started, `main` was already on Next.js `16.2.11`, so no additional runtime framework upgrade was required in this packet.

## Baseline audit evidence

Initial `npm audit --json` on PR #52 reported **7 vulnerabilities: 5 moderate, 2 high, 0 critical**.

Launch-blocking high findings:

- `nodemailer <=9.0.0` — message-level raw content could bypass `disableFileAccess` / `disableUrlAccess` (GHSA-p6gq-j5cr-w38f).
- npm-registry `xlsx@0.18.5` — Prototype Pollution (GHSA-4r6h-8v6p-xvw6) and ReDoS (GHSA-5pgg-2g8v-p4x9). The npm registry is stale; patched SheetJS CE releases are distributed by the maintainer from `cdn.sheetjs.com`.

Moderate findings were the Google Cloud Storage transitive `gaxios -> uuid` chain (GHSA-w5hq-g745-h8pq) plus related parent-chain audit entries.

## Remediation

- `nodemailer` upgraded to `^9.0.5`.
- `xlsx` switched from the stale npm registry package to the maintainer-published SheetJS CE `0.20.3` tarball: `https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`.
- `@google-cloud/storage` upgraded to `^8.0.1`.
- Added a targeted `gaxios -> uuid ^11.1.1` npm override to remove the remaining vulnerable transitive UUID while avoiding the breaking `gaxios` 7 upgrade.
- Regenerated `package-lock.json` through npm on Node 22.

Remediation audit evidence: **0 info, 0 low, 0 moderate, 0 high, 0 critical — 0 total**.

## Permanent gate

`.github/workflows/security-audit.yml` runs the deterministic `scripts/security-audit.mjs` gate on pull requests and manual dispatch. The gate now fails on **any** npm audit finding, not only high/critical findings.

## Acceptance criteria

- [x] Deterministic npm audit script exists.
- [x] Security Audit GitHub workflow exists.
- [x] Exact vulnerable packages/advisories captured.
- [x] SheetJS moved to maintainer-published patched distribution.
- [x] Nodemailer high-severity advisory remediated.
- [x] High vulnerabilities = 0.
- [x] Critical vulnerabilities = 0.
- [x] Moderate vulnerabilities = 0.
- [x] Total npm vulnerabilities = 0.
- [ ] Quality green on exact final head.
- [ ] E2E green on exact final head.
- [ ] Security Audit green on exact final head.
- [ ] No unresolved review threads.

EP-004 is complete only after the full regression gates are green on the final cleaned-up head.
