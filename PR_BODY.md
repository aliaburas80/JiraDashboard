# PR: feat(dashboard): visual polish — detail panel, KPIs, readiness, accessibility

## Summary
Polishes the Jira dashboard with interactive drill-downs, richer KPI cards, readiness insights, accessible modals, and responsive layouts to make delivery health actionable and visual.

## Changes
- `frontend/src/components/DashboardPage.js`: detail modal (focus trap, Escape to close), sticky quick-filters, KPI wiring, epic readiness panel, dependency callouts, responsive and accessibility hooks.
- `frontend/src/components/KpiCard.js`: hover tooltip, threshold track, numeric parsing, tooltip/threshold props.
- `frontend/src/styles.css`: modal styles, summary bar, KPI hover + threshold visuals, sticky filter styles, focus-visible and responsive breakpoints.
- `frontend/src/components/HelpGuide.js`: small copy/styling tweaks.

## Why
Surfaces risk and readiness faster, provides clear drill-downs for reviewers, improves keyboard accessibility and mobile usability.

## Testing / QA steps
1. Frontend build:

```bash
cd frontend
npm run build
```

2. Backend tests:

```bash
cd backend
npm test
```

3. Quick manual checks in the running app:
- Open a KPI card and hover to see tooltip and threshold legend.
- Open a detail item, press `Escape` to close, and verify focus returns to the page.
- Try the sticky quick-filter chips and `Show filters` action.
- Verify at-risk epics appear in "Epic health & release readiness" and "Dependency callouts" lists.

## Notes
- Frontend contains no unit tests in this repo; backend unit tests passed locally.
- Build compiled successfully on the feature branch.

## Checklist
- [ ] Code review
- [ ] Accessibility review
- [ ] QA sign-off
- [ ] Merge when approved
