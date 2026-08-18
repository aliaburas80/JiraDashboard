# EP-026 — Performance and Capacity Verification

**Status:** In validation  
**Depends on:** EP-017 golden metric regression baseline  
**Target scale:** 7,000 Jira issues  
**Environment:** GitHub Actions Chromium for regression verification; staging/production for final Web Vitals

## Objective

Verify that Delivery Clarity can process the top end of the MVP target dataset without losing aggregate accuracy, exceeding the intended browser payload cap, or developing a severe browser-side performance cliff.

This packet turns the earlier P0A-09 instrumentation in `product/PERFORMANCE.md` into an automated, repeatable regression check.

## Automated capacity scenario

`tests/e2e/performance-capacity.spec.ts` runs once in **Desktop Chrome** and:

1. Creates an isolated E2E admin account.
2. Generates a deterministic 7,000-row Jira CSV with `scripts/generate-synthetic-jira-export.js`.
3. Uploads it through the real authenticated `/api/upload` HTTP path.
4. Verifies aggregate `totalIssues = 7,000`.
5. Verifies `flow.items` is capped at exactly 5,000 while `flow.totalItemCount = 7,000` and `itemsCapped = true`.
6. Reads the real PostgreSQL `ImportLog` and verifies `parseTimeMs`, `mergeValidateTimeMs`, `metricsCalcTimeMs`, and `processingTimeMs` remain populated.
7. Opens the populated Priority Attention dashboard and captures the existing `metrics-loaded→paint` browser timing.
8. Changes the Blocked filter and captures the existing `filter→re-render` timing.
9. Builds/downloads the 17-sheet Excel workbook and captures `buildInsightWorkbook` timing.
10. Attaches the measured JSON result to the Playwright report and prints one `[EP-026]` JSON line into CI logs.

## CI regression ceilings

These are deliberately generous **regression tripwires**, not production SLAs:

| Signal | CI ceiling |
|---|---:|
| 7,000-row HTTP upload | < 30,000 ms |
| server `processingTimeMs` | < 15,000 ms |
| metrics-loaded → paint approximation | < 3,000 ms |
| Priority Attention filter → re-render approximation | < 1,000 ms |
| 17-sheet Excel workbook build | < 15,000 ms |

A failure means investigate before merge. Passing means only that no severe performance cliff is present on the CI runner.

## Why only Desktop Chrome

The heavy 7,000-row upload/export scenario is a capacity benchmark, not a cross-browser correctness test. The ordinary E2E suite already runs the critical path in Chrome, Firefox, WebKit, tablet, and mobile. Repeating the large benchmark five times would add CI cost without improving the representativeness of the capacity result.

## Acceptance criteria

- [ ] 7,000-row authenticated HTTP upload succeeds.
- [ ] Aggregate metrics retain all 7,000 issues.
- [ ] Browser flow-item payload remains capped to 5,000 with explicit cap metadata/warning.
- [ ] Upload timing instrumentation is persisted to PostgreSQL.
- [ ] Dashboard paint approximation is captured and below the CI regression ceiling.
- [ ] Filter re-render approximation is captured and below the CI regression ceiling.
- [ ] Excel workbook build timing is captured and below the CI regression ceiling.
- [ ] Normal Quality gate remains green.
- [ ] Full existing E2E regression suite remains green.

## Explicit non-claims / staging follow-up

EP-026 CI does **not** certify production-host performance or Core Web Vitals. GitHub-hosted runners are not the production environment, and the existing `metrics-loaded→paint` / filter timing logs are diagnostic approximations rather than LCP/INP/CLS.

Before controlled pilot, staging must still capture representative browser measurements for:

- LCP target: ≤ 2.5 s
- INP target: ≤ 200 ms
- CLS target: ≤ 0.1
- a representative production-like 7,000-row upload

Those staging measurements should be recorded as evidence for EP-028/EP-030 rather than inferred from CI.
