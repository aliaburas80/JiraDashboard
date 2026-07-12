# GitHub Workflow Implementation Plan

This plan starts from the repository as inspected on 2026-07-12. The existing `.github/workflows/quality.yml` workflow already validates the primary Next.js application with dependency install, Prisma client generation, TypeScript checking, SCSS linting, targeted ESLint checks, Jest, and production build.

## Current Gaps

- No issue templates to standardize problem statements, acceptance criteria, and technical considerations.
- No pull-request template to enforce validation notes, testing instructions, screenshots, risks, and self-review.
- Branch-protection expectations are not documented for `main`.
- The existing GitHub Actions workflow works, but it lacked manual dispatch, explicit read-only token permissions, concurrency cancellation, and a timeout.
- No written phased plan for expanding repository governance without overwriting working configuration.

## Phase 1: Repository Intake and Protection

- Keep all significant work off `main`; use `feature/`, `fix/`, `refactor/`, `docs/`, `test/`, `security/`, `performance/`, or `chore/` branches.
- Add issue templates for bugs, features, and engineering tasks.
- Add a pull-request template aligned with the solo-developer review checklist.
- Configure branch protection for `main` in GitHub:
  - Require pull requests before merging.
  - Require status checks to pass before merging.
  - Require the `Quality` workflow check.
  - Require branches to be up to date before merging when practical.
  - Require conversation resolution before merging.
  - Block force pushes and deletions.
  - Include administrators if you want the same guardrails for solo maintenance.

## Phase 2: GitHub Actions Validation

- Preserve the existing `Quality` workflow as the baseline validation path.
- Keep checks focused on commands that are known to exist in `package.json`.
- Add workflow hardening incrementally: least-privilege permissions, concurrency, timeout, and manual dispatch.
- After the baseline stays green, consider expanding validation to full ESLint or legacy backend tests only after confirming those suites are stable.

## Phase 3: Pull-Request Operating Model

- Open one issue for each legitimate feature, fix, refactor, documentation update, security improvement, dependency update, or performance improvement.
- Link each pull request to its issue with `Closes #ISSUE_NUMBER`.
- Use small Conventional Commit messages such as `fix: prevent empty dashboard state` or `docs: document branch protection`.
- Run the relevant local checks before pushing when possible.
- Treat solo pull requests as formal review checkpoints: inspect the diff, risks, test coverage, secrets, naming, accessibility, and performance before merge.

## Phase 4: Repository Maturity

- Add `CONTRIBUTING.md` once contribution expectations go beyond the PR template.
- Add `SECURITY.md` before accepting public vulnerability reports.
- Add `CODEOWNERS` if review ownership becomes useful.
- Add screenshots, sample data, and roadmap updates to the README as the product stabilizes.
- Revisit GitHub topics and repository description to improve discoverability honestly.

## First Recommended Issue

```markdown
## Problem

The repository has a working quality workflow, but it lacks standardized issue intake, pull-request review structure, and documented branch-protection settings.

## Expected outcome

Every meaningful change can follow an Issue -> Branch -> Implementation -> Tests -> Pull Request -> Validation -> Merge -> Close Issue workflow with consistent templates and protected `main` settings.

## Acceptance criteria

- [ ] Bug, feature, and engineering task issue templates exist
- [ ] Pull-request template exists with validation, testing, risk, and self-review sections
- [ ] Branch-protection recommendations are documented
- [ ] Existing GitHub Actions validation remains intact
- [ ] Workflow hardening does not remove existing checks

## Technical considerations

This is repository-governance work only. Avoid broad CI rewrites until existing checks are confirmed stable on GitHub.
```
