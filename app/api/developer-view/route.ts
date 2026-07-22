// STYLE-09 (2026-07-19, docs/product-audit/10-technical-cleanup.md "3
// hand-maintained API-surface descriptions" finding): every field below had
// drifted from the real codebase — Next.js version, all four service file
// paths, and the health-band thresholds (a stale 3-tier scale that predates
// the CP3-018 unification onto the 5-tier admin-configurable bands in
// thresholds.service.ts). Only healthScoreWeights was still accurate.
// Corrected by reading the real files directly rather than assuming; this is
// a manual, point-in-time correction, not a generated/enforced source of
// truth — see the resolution note in 10-technical-cleanup.md.
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';
import { SESSION_OPTIONS, type SessionData } from '@/lib/session';

export async function GET() {
  // P0A-04: internal architecture details are not public.
  const session = await getIronSession<SessionData>(await cookies(), SESSION_OPTIONS);
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }
  const developerView = {
    architecture: {
      framework: "Next.js 16.2.9 (App Router)",
      language: "TypeScript (strict mode)",
      styling: "SCSS Modules for component identity; Tailwind for layout utilities only",
    },
    services: [
      {
        name: "metrics.service.ts",
        path: "src/services/metrics/metrics.service.ts",
        description:
          "Core service responsible for computing sprint metrics, health scores, and aggregated KPIs from raw Jira issue data.",
      },
      {
        name: "parser.ts",
        path: "src/services/jira/parser.ts",
        description:
          "Parses and normalises raw Jira export files (CSV/XLSX/XLS) into typed internal domain objects consumed by the rest of the application.",
      },
      {
        name: "validation.ts",
        path: "src/services/jira/validation.ts",
        description:
          "Validates parsed Jira issue data, enforcing schema contracts before data reaches business logic.",
      },
      {
        name: "importLogs.service.ts",
        path: "src/services/imports/importLogs.service.ts",
        description:
          "Manages import log records, tracking the history and status of Jira data synchronisation events.",
      },
    ],
    types: [
      {
        name: "jira.ts",
        path: "src/types/jira.ts",
        description:
          "TypeScript interfaces and enums representing Jira domain entities such as issues, sprints, epics, and user objects.",
      },
      {
        name: "metrics.ts",
        path: "src/types/metrics.ts",
        description:
          "Type definitions for computed metric results, health scores, KPI snapshots, and sprint summary structures.",
      },
      {
        name: "api.ts",
        path: "src/types/api.ts",
        description:
          "Shared request/response payload types (upload, imports) used by some, not all, internal API routes.",
      },
    ],
    // Default bands — an admin can reconfigure these cutoffs via
    // /admin/settings (Thresholds tab); see src/types/thresholds.ts
    // DEFAULT_THRESHOLDS and src/lib/utils.ts getHealthBand().
    healthClassification: {
      excellent: {
        condition: "Health score >= 90",
      },
      good: {
        condition: "Health score >= 75 and < 90",
      },
      moderate: {
        condition: "Health score >= 60 and < 75",
      },
      atRisk: {
        condition: "Health score >= 40 and < 60",
      },
      critical: {
        condition: "Health score < 40",
      },
    },
    healthScoreWeights: {
      completionRate: 0.28,
      criticalFree: 0.24,
      warningFree: 0.12,
      sprintCompletion: 0.14,
      orphanFree: 0.12,
      cycleTimeScore: 0.1,
    },
  };

  return NextResponse.json(developerView);
}
