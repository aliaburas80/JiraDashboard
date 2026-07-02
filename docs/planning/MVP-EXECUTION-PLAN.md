# Delivery Clarity — MVP Execution Plan

> **Version:** 1.0 | **Date:** 2026-07-02
> **Status:** Active — EP-001 complete, EP-002 next
> **Product Owner:** Ali Abu Ras

---

## Execution Sequence

Only the current and next packet are fully detailed. Later packets are summarised.

| Packet | Title | Status | Blocker |
|---|---|---|---|
| EP-001 | Repository and TODO Reconciliation | ✅ Complete | — |
| EP-002 | Reproducible Quality Baseline | ✅ Complete | — |
| EP-003 | Canonical Version Alignment | ❌ Pending | EP-002 |
| EP-004 | Security Remediation (Next.js upgrade + npm vulns) | ⏸️ DEFERRED — final pre-launch round | PO decision 2026-07-02 |
| EP-005 | PostgreSQL Migration and Restore Verification | ❌ Pending | EP-002 |
| EP-006 | Workspace Data Model | ❌ Pending | EP-005 + PO decision |
| EP-007 | Existing-Data Workspace Migration | ❌ Pending | EP-006 |
| EP-008 | Workspace Authorisation Enforcement | ❌ Pending | EP-007 |
| EP-009 | Cross-Workspace Negative Tests | ❌ Pending | EP-008 |
| EP-010 | Authentication and Session Hardening | ❌ Pending | EP-009 |
| EP-011 | Public Registration | ❌ Pending | EP-010 |
| EP-012 | Email Verification | ❌ Pending | EP-011 |
| EP-013 | Password Reset | ❌ Pending | EP-012 |
| EP-014 | Consent and Legal Document Versioning | ❌ Pending | EP-013 |
| EP-015 | Trial Entitlement State Machine | ❌ Pending | EP-014 |
| EP-016 | Upload Validation and Transactional Processing | ❌ Pending | EP-015 |
| EP-017 | Golden Metric Regression Suite | ❌ Pending | EP-016 |
| EP-018 | Data Export and Account Deletion | ❌ Pending | EP-016 |
| EP-019 | Feedback Completion | ✅ Done (P0B-09) | — |
| EP-020 | Error Monitoring Completion | ✅ Done (P0B-08) | — |
| EP-021 | Minimum Product Analytics SDK | ❌ Pending | EP-015 |
| EP-022 | Separate Admin Application Foundation | ❌ Pending | EP-009 |
| EP-023 | Owner Bootstrap and Admin MFA | ❌ Pending | EP-022 |
| EP-024 | Admin Operational Pages | ⚠️ Partial (in main app) | EP-022 |
| EP-025 | CI/CD Production Gates | ❌ Pending | EP-020 |
| EP-026 | Performance and Capacity Verification | ❌ Pending | EP-017 |
| EP-027 | End-to-End and Security Regression | ❌ Pending | EP-024 |
| EP-028 | Staging Deployment | ❌ Pending | EP-025 |
| EP-029 | Controlled Pilot | ❌ Pending | EP-028 |
| EP-030 | MVP Go/No-Go Review | ❌ Pending | EP-029 |

---

## Critical Path

```
EP-001 (Done) → EP-002 (Done)
→ EP-005 DB Readiness
→ EP-006 Workspace Model   ← PO decision required
→ EP-008 Workspace Auth Enforcement
→ EP-010 Session Hardening
→ EP-011 Public Registration
→ EP-012 Email Verification
→ EP-013 Password Reset
→ EP-014 Consent + Privacy
→ EP-015 Trial Entitlement
→ EP-016 Upload + Entitlement Guard
→ EP-022 Separate Admin App
→ EP-023 Owner Bootstrap + Admin MFA
→ EP-027 E2E + Security Tests
→ EP-004 Next.js Upgrade + npm Security (full product round)  ← PO decision: last before launch
→ EP-030 Go/No-Go
```

**Product Owner decision (2026-07-02):** EP-004 (Next.js upgrade and npm vulnerability remediation) is deferred to the final pre-launch round. It requires a full product regression test cycle and must not be run mid-build. Accepted risk: Next.js 14.2.5 CVEs are present during the build phase. The soft launch is controlled and limited in account count; risk is accepted and recorded.

---

## Product Owner Decisions Required

| Decision | When Needed | Options |
|---|---|---|
| data/ credential files — real or test? | Before EP-002 | Rotate and remove if real |
| Workspace migration strategy | Before EP-006 | Option A (recommended) or Option B |
| `frontend/` directory fate | Before EP-025 | Remove or exclude from ESLint |
| Jira API feature flag — keep behind flag for MVP? | Before EP-004 | Recommended: Yes |
| Public registration form — use existing /register or new route? | Before EP-011 | Recommended: repurpose /register |
| Separate admin app domain for production | Before EP-022 | e.g. admin.deliveryclarityapp.com |

---

## Quality Gate for Each Packet

Every packet must pass before proceeding:

```bash
npx prisma validate
npx prisma generate
npm run typecheck
npm run lint
npm test -- --runInBand
npm run build
```

Plus any migration-specific or security-specific checks defined in the packet.

---

## Risk Register Summary

| ID | Risk | Probability | Impact | Mitigation |
|---|---|---|---|---|
| R-01 | Incorrect metric calculations | Low | Critical | Golden datasets + regression blocking |
| R-03 | Cross-workspace data access | Low | Critical | EP-006–EP-009 before any public launch |
| R-04 | Entitlement abuse | High | Medium | EP-015 state machine + rate limiting |
| R-08 | Admin compromise | Low | Critical | EP-022/EP-023 (separate app + MFA) |
| R-CRED | Credentials in repository | Unknown | Critical | Immediate PO action required |
| R-NPM | npm critical vulnerability | Confirmed | High | EP-004 |

Full risk register: `docs/planning/MVP-RISK-REGISTER.md`
