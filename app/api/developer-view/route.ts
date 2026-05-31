import { NextResponse } from "next/server";

export async function GET() {
  const developerView = {
    architecture: {
      framework: "Next.js 14",
      language: "TypeScript",
      styling: "Tailwind CSS",
    },
    services: [
      {
        name: "metrics.service.ts",
        path: "lib/metrics.service.ts",
        description:
          "Core service responsible for computing sprint metrics, health scores, and aggregated KPIs from raw Jira issue data.",
      },
      {
        name: "parser.ts",
        path: "lib/parser.ts",
        description:
          "Parses and normalises raw Jira API responses into typed internal domain objects consumed by the rest of the application.",
      },
      {
        name: "validation.ts",
        path: "lib/validation.ts",
        description:
          "Validates incoming request payloads and Jira data structures, enforcing schema contracts before data reaches business logic.",
      },
      {
        name: "importLogs.service.ts",
        path: "lib/importLogs.service.ts",
        description:
          "Manages import log records, tracking the history and status of Jira data synchronisation events.",
      },
    ],
    types: [
      {
        name: "jira.ts",
        path: "types/jira.ts",
        description:
          "TypeScript interfaces and enums representing Jira domain entities such as issues, sprints, epics, and user objects.",
      },
      {
        name: "metrics.ts",
        path: "types/metrics.ts",
        description:
          "Type definitions for computed metric results, health scores, KPI snapshots, and sprint summary structures.",
      },
      {
        name: "api.ts",
        path: "types/api.ts",
        description:
          "Request and response payload types for all internal API routes, ensuring end-to-end type safety across the network boundary.",
      },
    ],
    healthClassification: {
      critical: {
        condition: "Health score < 50",
      },
      warning: {
        condition: "Health score >= 50 and < 75",
      },
      good: {
        condition: "Health score >= 75",
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
