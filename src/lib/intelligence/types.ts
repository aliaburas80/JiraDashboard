// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.

export type IntelligenceAgentId = 'executive' | 'flow' | 'risk' | 'forecast';
export type IntelligenceSeverity = 'neutral' | 'good' | 'warning' | 'critical';
export type IntelligenceMode = 'ai' | 'evidence';

export interface IntelligenceRiskItem {
  key: string;
  summary: string;
  status: string;
  assignee: string;
  reason: string;
  ageDays: number | null;
  blocked: boolean;
  severity: IntelligenceSeverity;
}

export interface IntelligenceCapacityHotspot {
  assignee: string;
  loadShare: number;
  activeIssues: number;
  issues: number;
}

export interface IntelligenceEpicSignal {
  name: string;
  progress: number;
  critical: number;
  warning: number;
  issues: number;
}

export interface IntelligenceSnapshot {
  generatedAt: string;
  totalIssues: number;
  doneIssues: number;
  activeIssues: number;
  completionRate: number;
  deliveryConfidence: number;
  healthScore: number;
  blockedIssues: number;
  criticalIssues: number;
  openDefects: number;
  dataQualityScore: number;
  averageLeadTimeDays: number;
  averageCycleTimeDays: number;
  forecast: {
    complete: boolean;
    daysRemaining: number | null;
    predictedDate: string | null;
    velocityPerDay: number | null;
  };
  riskItems: IntelligenceRiskItem[];
  capacityHotspots: IntelligenceCapacityHotspot[];
  epicSignals: IntelligenceEpicSignal[];
  sourceInsights: string[];
}

export interface IntelligenceFinding {
  title: string;
  detail: string;
  severity: IntelligenceSeverity;
  evidence?: string;
}

export interface IntelligenceAction {
  title: string;
  owner: string;
  rationale: string;
  priority: 'now' | 'next' | 'watch';
  href?: string;
}

export interface IntelligenceAnswer {
  agent: IntelligenceAgentId;
  title: string;
  summary: string;
  findings: IntelligenceFinding[];
  actions: IntelligenceAction[];
  mode: IntelligenceMode;
  model?: string;
  note?: string;
}

export interface IntelligenceAgentDefinition {
  id: IntelligenceAgentId;
  name: string;
  shortName: string;
  description: string;
  icon: 'briefcase' | 'activity' | 'shield' | 'timeline';
  suggestedQuestions: string[];
}
