# Delivery Clarity — Prior Art Comparison

**Author:** Ali Abu Ras | **Date:** 2026-05-31

---

## Summary

This document compares Delivery Clarity's technical approach against the closest known prior art in the Agile delivery analytics space.

---

## Comparison Matrix

| Dimension | Jira Native | Jira Align | LinearB | Tableau+Jira | Custom Scripts | **Delivery Clarity** |
|-----------|-------------|------------|---------|--------------|----------------|---------------------|
| **Data source** | Live API | Live API | Live API + GitHub | Live API | Varies | **Export-only (CSV/XLSX)** |
| **Credential requirement** | OAuth token | Enterprise OAuth | GitHub + Jira OAuth | API token | Varies | **Zero credentials** |
| **Self-hosted** | ❌ Cloud | ❌ Cloud | ❌ Cloud | Partial | ✅ | **✅ Fully self-hosted** |
| **Works offline/air-gapped** | ❌ | ❌ | ❌ | ❌ | Varies | **✅** |
| **Field normalisation** | N/A (native) | N/A | Partial | Manual | Manual | **✅ 40+ alias mappings** |
| **Hierarchy reconstruction** | Requires correct data | Partial | ❌ | ❌ | Manual | **✅ Multi-signal confidence** |
| **Orphan classification** | ❌ | ❌ | ❌ | ❌ | ❌ | **✅ 4-class + impact** |
| **Orphan as delivery risk** | ❌ | ❌ | ❌ | ❌ | ❌ | **✅ First-class risk treatment** |
| **Composite health score** | Partial | Partial | Partial | ❌ | Custom | **✅ 6-signal weighted score** |
| **Explainable recommendations** | Basic | Partial | Partial | ❌ | ❌ | **✅ Evidence + owner + action** |
| **Visual work item explorer** | Board/Backlog | Roadmap | ❌ | ❌ | ❌ | **✅ Interactive hierarchy graph** |
| **Sprint mid-point analysis** | ❌ | Partial | ❌ | ❌ | ❌ | **✅ Per-sprint pattern detection** |
| **Kanban flow efficiency** | Basic | ❌ | Partial | ❌ | ❌ | **✅ Period-by-period with trend** |
| **Statistical Excel export** | ❌ | Partial | ❌ | Partial | ❌ | **✅ 17-sheet statistical workbook** |
| **Delivery SLA percentiles** | ❌ | ❌ | ❌ | Partial | Custom | **✅ P50/P75/P85/P95** |

---

## Detailed Comparison

### vs. Jira Native Reporting

**What Jira native provides:**
- Board, backlog, sprint velocity chart, burndown
- Control chart (cycle time scatter plot, no aggregation)
- Cumulative flow diagram (per-board)
- Release Hub (basic completion tracking)

**What it does NOT provide:**
- Works only with live Jira instance (OAuth required)
- No field normalisation — assumes data is clean
- No hierarchy reconstruction — orphans are invisible
- No composite health score
- No orphan risk classification
- No explainable recommendations
- No export-based operation
- No visual work item graph

**Delivery Clarity distinguishes:** Zero-credential export operation; hierarchy reconstruction; orphan risk treatment; health score; recommendations with evidence.

---

### vs. Jira Align (formerly AgileCraft)

**What Jira Align provides:**
- Enterprise-scale program/portfolio management
- PI planning, roadmap, dependency management
- Requires: Jira instance + Jira Align Enterprise license ($10k+/year)
- Real-time dashboard from live API

**What it does NOT provide:**
- Export-based operation (requires live connection always)
- Self-hosted for small teams
- Orphan risk classification
- Export-file-based hierarchy reconstruction
- Multi-signal health scoring from exports
- Evidence-backed recommendation engine

**Delivery Clarity distinguishes:** Zero-credential; self-hosted; accessible to small teams; export-based; evidence-backed recommendations.

---

### vs. LinearB

**What LinearB provides:**
- Git + Jira integration for engineering metrics
- DORA metrics (deployment frequency, lead time for changes)
- Cycle time, PR metrics
- Requires: GitHub/GitLab OAuth + Jira OAuth

**What it does NOT provide:**
- Jira-export-only mode
- Zero-credential operation
- Orphan detection or hierarchy reconstruction
- Sprint mid-point pattern analysis
- Visual work item hierarchy explorer
- Self-hosted deployment

**Delivery Clarity distinguishes:** Export-only (no Git required); orphan risk; visual explorer; mid-sprint patterns; self-hosted.

---

### vs. Tableau + Jira Connector

**What the combination provides:**
- Powerful visualisation of Jira data
- Requires: Jira API access + Tableau license
- Charts and dashboards are custom-built per organisation

**What it does NOT provide:**
- Zero-credential operation
- Automatic hierarchy reconstruction
- Orphan risk detection
- Pre-built delivery health scoring
- Export-file ingestion without Jira API
- Pre-built recommendation engine

**Delivery Clarity distinguishes:** No-code setup; zero-credential; automatic hierarchy reconstruction; pre-built intelligence.

---

### vs. Custom Python/Excel Scripts

**What exists:**
- Many organisations build custom pandas scripts to analyse Jira CSV exports
- These typically extract issue counts, filter by status, compute simple averages

**What they do NOT provide:**
- Multi-signal hierarchy reconstruction with confidence scoring
- Orphan classification with delivery impact statements
- Composite health scoring
- Visual interactive work item graph
- Packaged, reusable application
- Evidence-backed recommendation engine

**Delivery Clarity distinguishes:** Packaged application; multi-signal hierarchy inference; orphan risk treatment; visual explorer; recommendation engine.

---

## Summary of Novel Combinations

The following combinations of capabilities do not appear in any single prior-art system:

1. **Export-only + hierarchy reconstruction** — Prior tools either use live API (no reconstruction needed) or don't reconstruct hierarchy at all.

2. **Orphan classification with delivery impact** — No prior tool classifies orphans into MISSING_EPIC/MISSING_PARENT/DANGLING_LINK/FULLY_ORPHANED with specific delivery impact statements.

3. **Composite health score from export data** — Prior health metrics either require live API or are single-signal (e.g. completion rate only).

4. **Evidence-backed recommendation engine applied to Agile exports** — Prior tools give generic recommendations or require ML training data.

5. **Visual work item explorer from export data** — Prior tools' visual graphs require live API. No prior tool shows an interactive hierarchy graph from a CSV/XLSX export alone.

6. **Statistical Excel workbook with delivery SLA percentiles** — Prior Excel exports from Agile tools copy data tables. No prior tool computes percentile-based delivery SLAs in the export.

---

*© 2025 Ali Abu Ras — aburasali80@gmail.com — Delivery Clarity*

---

## Current Code Alignment — 2026-06-06

Cloud backup and bucket-first latest-metrics loading are implemented as operational persistence features. The prior-art distinction remains the same: delivery intelligence is computed from static Jira exports without Jira OAuth/API access; bucket storage holds Delivery Clarity backups, not a live Jira connector.
