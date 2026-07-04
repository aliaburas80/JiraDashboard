# Delivery Clarity — Claim Candidate Matrix

**Author:** Ali Abu Ras | **Date:** 2026-05-31
**Status:** Pre-filing Candidate Review

---

## Claim Strength Legend

| Strength | Meaning |
|----------|---------|
| **Strong** | Novel combination, clear technical distinction from prior art, implementable claim |
| **Medium** | Novel aspect exists but prior art may partially overlap; dependent claim candidate |
| **Weak** | Concept exists in prior art in some form; only novel as specific combination |

---

## Candidate Claims

### C-01 — Zero-Credential Export-Based Delivery Intelligence

**Claim text (draft):**
A method of generating delivery intelligence from Agile project management data comprising: receiving a static file export in CSV or XLSX format from a project management system; extracting issue records from the file without establishing a live connection to said project management system; normalising field names using a deterministic alias resolver; computing delivery metrics from the normalised issue records; and presenting the computed metrics as delivery intelligence without requiring authentication tokens or API credentials for the project management system.

**Strength:** Strong
**Basis:** No prior art system operates without live API credentials. This is a core architectural distinction.
**Prior art gap:** All identified prior art (Jira native, LinearB, Jira Align, Tableau+Jira) requires live API authentication.

---

### C-02 — Multi-Signal Hierarchy Reconstruction from Export Files

**Claim text (draft):**
A computer-implemented method of reconstructing work item hierarchy from a project management export file comprising: parsing issue records from the export file; applying a first inference step using explicit parent-child field values with a first confidence score; applying a second inference step using issue key prefix matching with a second confidence score lower than the first; applying a third inference step using sprint co-membership with a third confidence score; applying only inferences above a threshold confidence score; and constructing a directed hierarchy graph from the resolved links.

**Strength:** Strong
**Basis:** No prior tool uses multi-signal inference with confidence scoring for hierarchy reconstruction from export files. Jira native doesn't need this; third-party tools use live API.
**Prior art gap:** The combination of (a) export-only input, (b) multi-signal inference, (c) confidence scoring, (d) threshold filtering is novel.

---

### C-03 — Orphan Item Classification with Delivery Impact Statements

**Claim text (draft):**
A computer-implemented method for detecting and classifying orphaned work items in a project management export comprising: identifying work items with no resolvable parent-child link after applying hierarchy reconstruction; classifying each orphaned item into one of: MISSING_EPIC for story-level items, MISSING_PARENT for task-level items, DANGLING_LINK for items referencing non-existent parents, and FULLY_ORPHANED; generating for each classified item a delivery impact statement describing what delivery reporting is affected; and generating for each classified item a suggested corrective action.

**Strength:** Strong
**Basis:** No prior system classifies orphan items with delivery impact statements. All prior art either ignores orphans or counts them without classification.
**Prior art gap:** The four-class classification system with delivery-impact statements is novel.

---

### C-04 — Six-Signal Composite Delivery Health Score

**Claim text (draft):**
A computer-implemented method for computing a composite delivery health score comprising: computing a completion signal from the ratio of completed to total work items; computing a flow health signal from the ratio of critical and warning work items; computing a velocity trend signal from the comparison of recent and historical throughput; computing a cycle time signal from the average time from work start to completion; computing a blocked ratio signal from the ratio of blocked to total items; computing an orphan ratio signal from the ratio of orphan items to total items; applying predetermined weights to each signal summing to 1.0; and returning a score in the range 0–100.

**Strength:** Medium
**Basis:** Composite health scores exist in other domains. The novel aspect is the specific six-signal combination applied to Agile delivery data derived from export files, where each signal is independently inspectable.
**Dependent claim note:** Make dependent on C-01 (export-only context) to strengthen.

---

### C-05 — Deterministic Evidence-Backed Recommendation Engine for Agile Delivery

**Claim text (draft):**
A computer-implemented system for generating delivery recommendations comprising: a rule engine evaluating delivery metric values against predetermined threshold conditions; for each triggered threshold, generating a recommendation object comprising: a priority classification; a delivery area classification; a recommendation statement with metric values substituted; an evidence string identifying the specific data items and values that triggered the recommendation; an impact statement describing delivery consequences; a suggested owner role; and a suggested corrective action; and sorting generated recommendations by priority classification.

**Strength:** Medium
**Basis:** Rule-based recommendation engines exist generally. The novel aspect is the specific structure: evidence string with specific data provenance attached to each recommendation, applied to Agile delivery metrics from export data.
**Prior art gap:** No prior Agile delivery tool attaches traceable data evidence to each recommendation.

---

### C-06 — Visual Work Item Explorer with Orphan Risk Differentiation

**Claim text (draft):**
A computer-implemented method of rendering a visual work item hierarchy map comprising: receiving a focus work item key; reconstructing the work item hierarchy using multi-signal inference; building a graph of connected nodes comprising the focus item, its descendants, its ancestor chain, and related siblings; rendering each node with a visual style determined by the work item type; rendering orphan nodes with a visually distinct style comprising a dashed border, a risk color scheme, and an orphan classification label; rendering edges with a line style and color determined by the relation type; and supporting interactive expand/collapse of child branches per node.

**Strength:** Medium
**Basis:** Interactive hierarchy graphs exist (e.g. org chart tools, dependency maps). The novel aspect is the combination of: (a) export-only input, (b) hierarchy reconstruction, (c) orphan risk visual differentiation with classification labels, (d) multi-type node styling, (e) relation-type-differentiated edges.

---

### C-07 — Statistical Project Export with Delivery SLA Percentiles

**Claim text (draft):**
A computer-implemented method for generating a statistical project export comprising: computing lead time percentiles at the 50th, 75th, 85th, and 95th percentile from completed work item records; computing cycle time percentiles at the same percentiles; computing sprint velocity trend as the difference between the average throughput of the three most recent sprints and the average throughput of the three preceding sprints; computing flow efficiency as the ratio of cycle time to lead time for each reporting period; generating a release readiness classification of one of Go, Conditional Go, or No-Go for each release version; and embedding all computed values in a structured multi-sheet workbook file.

**Strength:** Medium
**Basis:** Excel workbooks with project data exist widely. The novel aspect is the specific combination of derived statistical values (percentiles, trend delta, flow efficiency, release readiness classification) applied to Agile export data in a structured multi-sheet format.

---

## Recommended Filing Strategy

1. File C-01 (zero-credential architecture) as broadest independent claim
2. File C-02 (hierarchy reconstruction) as independent claim
3. File C-03 (orphan classification) as independent claim — highest novelty
4. File C-04, C-05, C-06, C-07 as dependent claims on C-01 or C-02

---

## Not Recommended for Filing

| Topic | Reason |
|-------|--------|
| Sprint burndown charts | Prior art: Jira native, many tools |
| Kanban cumulative flow | Prior art: well-documented |
| Story point tracking | Prior art: widespread |
| CSV file parsing | Prior art: trivially obvious |
| Role-based access control | Prior art: standard software pattern |

---

*© 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app — Delivery Clarity*

---

## Current Code Alignment — 2026-06-06

Cloud backup and bucket-first latest-metrics startup are now implemented. Patent/claim material remains focused on export-only delivery intelligence and does not claim a live Jira integration; the cloud bucket stores Delivery Clarity backups and latest computed metrics, not Jira credentials or live Jira data.
