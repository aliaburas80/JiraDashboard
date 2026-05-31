# Delivery Clarity — Patent Disclosure

**Title:** Zero-Credential Export-Based Delivery Intelligence System with Incomplete Work Hierarchy Reconstruction, Orphan Risk Detection, Multi-Signal Health Scoring, Explainable Recommendations, and Statistical Project Export

**Inventor:** Ali Abu Ras
**Date:** 2026-05-31
**Status:** Disclosure — Not Yet Filed

---

## 1. Technical Field

This disclosure relates to software delivery analytics systems, specifically to a method and system for reconstructing work item hierarchy from static project management export files, detecting orphaned delivery-risk items, computing a multi-signal Agile delivery health score, generating evidenced recommendations, and producing a statistical project export — all without live API credentials or database connections to the source system.

---

## 2. Problem Statement

Existing Agile delivery analytics tools share three fundamental limitations:

1. **Credential dependency** — All major tools (Jira native, LinearB, Jira Align) require live API tokens or OAuth connections to Jira. This creates security exposure, blocks analysis behind firewalls, and prevents retrospective analysis of archived exports.

2. **Assumption of clean data** — Tools assume Jira data is fully structured with complete parent-child links, Epic assignments, and consistent field names. Real Jira exports are messy: field names vary by Jira version and project configuration, parent-child links are incomplete, and issue type names are inconsistent across organisations.

3. **Missing hierarchy risk detection** — No existing tool treats orphan issues (items with no Epic or parent link) as *delivery risks*. They are either silently excluded from reporting, shown as a raw count, or ignored entirely. Orphan issues can represent 10–30% of a project's total scope and their exclusion causes significant reporting inaccuracy.

---

## 3. Summary of the Invention

Delivery Clarity is a zero-credential, self-hosted delivery intelligence system that:

1. Accepts Jira project exports (CSV or XLSX) as the sole data input
2. Normalises inconsistent field names using a deterministic alias resolver
3. Reconstructs incomplete work item hierarchy using multi-signal inference
4. Classifies items with no resolvable hierarchy as delivery risks with specific impact statements
5. Computes a composite delivery health score from six independently-calculated signals
6. Generates explainable, evidence-backed recommendations using a deterministic rule engine
7. Renders an interactive, collapsible visual work item explorer with risk-differentiated node styles
8. Produces a 17-sheet statistical Excel workbook with derived delivery intelligence metrics

---

## 4. Detailed Description

### 4.1 Zero-Credential Architecture

The system operates entirely from static file uploads. No API credentials, tokens, or OAuth flows are required. Data flows: User uploads CSV/XLSX → Server parses file → Metrics computed in-process → Results stored in localStorage (client) or SQLite (server). At no point does the system communicate with Jira.

**Technical novelty:** The system derives equivalent delivery intelligence to live-API tools from export files alone, using field normalisation and inference to compensate for the reduced data richness.

### 4.2 Field Normalisation

Jira exports from different versions and configurations use different field names for the same data. Example: `Epic Link`, `Epic Name`, `Custom field (Epic Link)` all refer to the epic relationship.

The system applies a deterministic alias resolver with 40+ field name mappings, followed by type-safe parsers for dates (6 format variants including Excel serial numbers and Jira's dd/Mon/yyyy format), integers, story points, and boolean flags.

### 4.3 Incomplete Hierarchy Reconstruction

When explicit parent-child links are absent or incomplete, the system applies a four-signal inference algorithm:

| Signal | Method | Confidence |
|--------|--------|-----------|
| Explicit Parent Key | Direct field read | 1.0 |
| Explicit Epic Link | Direct field read | 1.0 |
| Key-prefix matching | Same project prefix as known Epic | 0.8 |
| Sprint co-membership | Issues in same sprint as linked items | 0.5 |

Each inferred link carries its confidence score. Only links above the threshold (0.5) are applied. The reconstruction builds a directed hierarchy graph from which descendants, ancestors, and siblings can be traversed via BFS/DFS.

### 4.4 Orphan Risk Detection and Classification

Issues that cannot be linked via any signal are classified into four categories:

- **MISSING_EPIC** — Story/Task/Feature with no resolvable Epic link
- **MISSING_PARENT** — Sub-task/Bug with no resolvable parent Story
- **DANGLING_LINK** — Has an Epic/Parent key that does not exist in the exported dataset
- **FULLY_ORPHANED** — No links resolvable from any signal

Each classification carries a specific delivery impact statement ("Items without Epic do not appear in roadmap reporting") and a suggested fix ("Assign this item to an Epic in Jira using the Epic Link field, then re-export").

**Technical novelty:** Treating orphan items as delivery risks rather than data gaps, with classification, impact quantification, and visual differentiation in the delivery map.

### 4.5 Multi-Signal Delivery Health Score

A composite score from 0–100 computed as a weighted sum of six independently-calculated signals:

```
health_score =
  completion_rate    × 0.25   +   (0–25)
  flow_health        × 0.20   +   (0–20) based on critical/warning ratios
  velocity_trend     × 0.15   +   (0–15) improving/stable/declining
  cycle_time_score   × 0.15   +   (0–15) based on avg cycle time percentile
  (1 - blocked_ratio)× 0.15   +   (0–15)
  (1 - orphan_ratio) × 0.10       (0–10)
```

Each signal is computed independently and can be inspected separately. The score maps to five named bands: Excellent (≥90), Good (≥75), Moderate (≥60), At Risk (≥40), Critical (<40).

### 4.6 Explainable Recommendation Engine

A deterministic rule engine evaluates the metrics object against 12+ threshold rules. Each triggered rule produces a `Recommendation` object with:

- Priority (Critical/High/Medium/Low)
- Area (Delivery/Quality/Process/Data/Team/Flow)
- Recommendation text
- Evidence (specific counts, percentages, item keys that triggered the rule)
- Impact description
- Suggested owner
- Suggested action

No recommendation is produced without traceable evidence from the metrics data. This distinguishes the system from ML-based approaches where evidence is opaque.

### 4.7 Interactive Work Item Explorer

A visual graph rendered using React Flow with Dagre hierarchical layout that:

- Places the focus issue as the root/highlighted node
- Draws ancestor chain above (Epic → Story → Task)
- Draws all descendants as children
- Shows related siblings within the same level
- Uses type-specific node styles (color, icon, size) for 10 issue types
- Differentiates orphan nodes with dashed orange border and "ORPHAN" badge
- Uses edge styles to convey relation type (solid, dotted, dashed, colored)
- Supports expand/collapse per node, fit-to-screen, pan/zoom, mini-map

**Technical novelty:** Combination of hierarchy reconstruction, orphan-risk visual treatment, and multi-type node differentiation in a single interactive delivery map.

### 4.8 Statistical Excel Export

A 17-sheet Excel workbook that computes derived statistical values rather than reproducing UI data:

- Percentile analysis of lead time and cycle time (P50, P75, P85, P95)
- Sprint delivery trend (delta vs. previous 3-sprint average)
- Flow efficiency computation (cycle time / lead time × 100)
- Release readiness classification (Go / Conditional Go / No-Go) per fix version
- Evidenced recommendations with full traceability
- Metric dictionary with formula documentation
- Executive narrative paragraph auto-generated from metrics

---

## 5. Claims Summary (Candidate)

See `CLAIM_CANDIDATE_MATRIX.md` for the full candidate claim matrix.

Key claim areas:
1. Method of reconstructing work item hierarchy from static exports using multi-signal confidence-scored inference
2. System for classifying orphan items as delivery risks with impact statements
3. Composite delivery health score computed from six independently-calculated signals applied to export-derived data
4. Deterministic recommendation engine with evidence traceability applied to Agile delivery metrics
5. Visual work item explorer combining hierarchy reconstruction, orphan risk differentiation, and multi-type node styling
6. Statistical project export computing derived delivery intelligence from Agile project exports

---

## 6. Prior Art Considered

See `PRIOR_ART_COMPARISON.md` for detailed comparison.

The closest known prior art:
- Jira native reporting — requires live connection, no hierarchy reconstruction, no orphan risk treatment
- LinearB — requires GitHub integration + Jira API, no export-based mode
- Jira Align — enterprise tool, live API, no orphan classification
- Tableau + Jira connector — requires API, no delivery intelligence, no hierarchy inference
- Custom Python scripts — exist but are not packaged systems, no visual explorer, no recommendation engine

---

*© 2025 Ali Abu Ras — aburasali80@gmail.com — Delivery Clarity*
