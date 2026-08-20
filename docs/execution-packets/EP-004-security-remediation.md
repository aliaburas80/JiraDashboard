# EP-004 — Security Remediation

**Status:** In progress  
**Phase:** Final pre-launch security round  
**Started from:** `main` commit `cc0473a41b716afc0536f07014a9fe7c710c69ee`

## Goal

Remove high/critical npm dependency vulnerabilities before MVP go/no-go without broad, speculative upgrades.

## Execution approach

1. Capture exact `npm audit --json` evidence on the tested branch.
2. Identify direct/transitive vulnerable packages and available remediations.
3. Apply the smallest compatible dependency changes.
4. Require zero high/critical npm vulnerabilities.
5. Run the full Quality + E2E regression cycle because this is the deferred pre-launch dependency round.

## Acceptance criteria

- [x] Deterministic npm audit script exists.
- [x] Security Audit GitHub workflow exists.
- [ ] Exact vulnerable packages/advisories captured.
- [ ] High vulnerabilities = 0.
- [ ] Critical vulnerabilities = 0.
- [ ] Quality green on exact final head.
- [ ] E2E green on exact final head.
- [ ] No unresolved review threads.

Moderate/low findings may remain only if explicitly reviewed and recorded as accepted non-launch-blocking risk.
