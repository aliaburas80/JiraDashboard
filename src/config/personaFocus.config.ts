// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Soft-launch "Persona Preview" content — which dashboard pages best answer
// each persona's day-to-day questions. Presentational only: this never
// changes what data a user can access, only which pages are highlighted.
// Reuses the PERSONAS list already captured at registration (src/lib/personas.ts)
// so the two stay in sync — add a persona there, add its focus here.

import { PERSONAS, type Persona } from '@/lib/personas';

export interface PersonaFocusArea {
  title: string;
  href:  string;
}

export interface PersonaFocusConfig {
  persona:     Persona;
  summary:     string;
  focusAreas:  PersonaFocusArea[];
}

export const PERSONA_FOCUS: Record<Persona, PersonaFocusConfig> = {
  'Scrum Master': {
    persona: 'Scrum Master',
    summary: 'Day-to-day team execution — what’s in flight, what’s blocked, and what needs attention before standup.',
    focusAreas: [
      { title: 'Trends',               href: '/dashboard/trends' },
      { title: 'Ownership',            href: '/dashboard/ownership' },
      { title: 'Priority Attention',   href: '/dashboard/priority-attention' },
      { title: 'Flow Health',          href: '/dashboard/flow-health' },
    ],
  },
  'Product Owner': {
    persona: 'Product Owner',
    summary: 'Scope and priorities — what’s shipping this quarter and which epics need decisions.',
    focusAreas: [
      { title: 'Data Quality',         href: '/dashboard/data-quality' },
      { title: 'Epic Readiness',       href: '/dashboard/epic-readiness' },
      { title: 'Priority Attention',   href: '/dashboard/priority-attention' },
      { title: 'Trends',               href: '/dashboard/trends' },
    ],
  },
  'Project Manager': {
    persona: 'Project Manager',
    summary: 'Timelines and risk — delivery controls, ownership, and where things could slip.',
    focusAreas: [
      { title: 'Key Metrics',          href: '/dashboard/key-metrics' },
      { title: 'Trends',               href: '/dashboard/trends' },
      { title: 'Ownership',            href: '/dashboard/ownership' },
      { title: 'Flow Health',          href: '/dashboard/flow-health' },
    ],
  },
  'Engineering Manager': {
    persona: 'Engineering Manager',
    summary: 'Team capacity and data hygiene — workload balance and where the data itself needs cleanup.',
    focusAreas: [
      { title: 'Ownership',            href: '/dashboard/ownership' },
      { title: 'Flow Health',          href: '/dashboard/flow-health' },
      { title: 'Data Quality',         href: '/dashboard/data-quality' },
      { title: 'Labels',               href: '/dashboard/labels' },
    ],
  },
  'Agile Coach': {
    persona: 'Agile Coach',
    summary: 'Team health and continuous improvement — flow friction, blockers, and workload balance worth raising in retros.',
    focusAreas: [
      { title: 'Flow Health',          href: '/dashboard/flow-health' },
      { title: 'Priority Attention',   href: '/dashboard/priority-attention' },
      { title: 'Ownership',            href: '/dashboard/ownership' },
      { title: 'Trends',               href: '/dashboard/trends' },
    ],
  },
  'Delivery Manager': {
    persona: 'Delivery Manager',
    summary: 'Cross-team delivery risk — throughput trend, flow friction, and where capacity is stretched thin.',
    focusAreas: [
      { title: 'Key Metrics',          href: '/dashboard/key-metrics' },
      { title: 'Trends',               href: '/dashboard/trends' },
      { title: 'Flow Health',          href: '/dashboard/flow-health' },
      { title: 'Ownership',            href: '/dashboard/ownership' },
    ],
  },
  'Team Lead': {
    persona: 'Team Lead',
    summary: 'Day-to-day team execution and hygiene — what’s blocked, who’s carrying too much, and where the data needs cleanup.',
    focusAreas: [
      { title: 'Priority Attention',   href: '/dashboard/priority-attention' },
      { title: 'Ownership',            href: '/dashboard/ownership' },
      { title: 'Flow Health',          href: '/dashboard/flow-health' },
      { title: 'Data Quality',         href: '/dashboard/data-quality' },
    ],
  },
  Executive: {
    persona: 'Executive',
    summary: 'The high-level picture — overall health, trend direction, and delivery mix at a glance.',
    focusAreas: [
      { title: 'Summary',              href: '/dashboard/summary' },
      { title: 'Trends',               href: '/dashboard/trends' },
      { title: 'Data Quality',         href: '/dashboard/data-quality' },
    ],
  },
  'Jira Administrator': {
    persona: 'Jira Administrator',
    summary: 'Data hygiene and configuration health — where fields, labels, and epics need cleanup to keep reporting trustworthy.',
    focusAreas: [
      { title: 'Data Quality',         href: '/dashboard/data-quality' },
      { title: 'Labels',               href: '/dashboard/labels' },
      { title: 'Epic Readiness',       href: '/dashboard/epic-readiness' },
      { title: 'Summary',              href: '/dashboard/summary' },
    ],
  },
  Consultant: {
    persona: 'Consultant',
    summary: 'A fast, credible overview for engagements — overall health, trend direction, and data trustworthiness at a glance.',
    focusAreas: [
      { title: 'Summary',              href: '/dashboard/summary' },
      { title: 'Trends',               href: '/dashboard/trends' },
      { title: 'Data Quality',         href: '/dashboard/data-quality' },
      { title: 'Key Metrics',          href: '/dashboard/key-metrics' },
    ],
  },
  Other: {
    persona: 'Other',
    summary: 'A general starting point — overall health and trend direction, useful regardless of your specific role.',
    focusAreas: [
      { title: 'Summary',              href: '/dashboard/summary' },
      { title: 'Trends',               href: '/dashboard/trends' },
    ],
  },
};

export const PERSONA_FOCUS_LIST: PersonaFocusConfig[] = PERSONAS.map(p => PERSONA_FOCUS[p]);
