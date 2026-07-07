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
      { title: 'Sprint Status',        href: '/dashboard/sprint-status' },
      { title: 'Kanban Health',        href: '/dashboard/kanban-health' },
      { title: 'Priority Attention',   href: '/dashboard/priority-attention' },
      { title: 'Flow Health',          href: '/dashboard/flow-health' },
    ],
  },
  'Product Owner': {
    persona: 'Product Owner',
    summary: 'Scope and priorities — what’s shipping this quarter and which epics need decisions.',
    focusAreas: [
      { title: 'Delivery Composition', href: '/dashboard/delivery-composition' },
      { title: 'Epic Readiness',       href: '/dashboard/epic-readiness' },
      { title: 'Priority Attention',   href: '/dashboard/priority-attention' },
      { title: 'Quarter Statistics',   href: '/dashboard/quarter-statistics' },
    ],
  },
  'Project Manager': {
    persona: 'Project Manager',
    summary: 'Timelines and risk — delivery controls, ownership, and where things could slip.',
    focusAreas: [
      { title: 'Delivery Controls',    href: '/dashboard/delivery-controls' },
      { title: 'Quarter Statistics',   href: '/dashboard/quarter-statistics' },
      { title: 'Ownership',            href: '/dashboard/ownership' },
      { title: 'Flow Health',          href: '/dashboard/flow-health' },
    ],
  },
  'Engineering Manager': {
    persona: 'Engineering Manager',
    summary: 'Team capacity and data hygiene — workload balance and where the data itself needs cleanup.',
    focusAreas: [
      { title: 'Ownership',            href: '/dashboard/ownership' },
      { title: 'Kanban Health',        href: '/dashboard/kanban-health' },
      { title: 'Data Quality',         href: '/dashboard/data-quality' },
      { title: 'Labels',               href: '/dashboard/labels' },
    ],
  },
  Executive: {
    persona: 'Executive',
    summary: 'The high-level picture — overall health, trend direction, and delivery mix at a glance.',
    focusAreas: [
      { title: 'Summary',              href: '/dashboard/summary' },
      { title: 'Quarter Statistics',   href: '/dashboard/quarter-statistics' },
      { title: 'Delivery Composition', href: '/dashboard/delivery-composition' },
    ],
  },
};

export const PERSONA_FOCUS_LIST: PersonaFocusConfig[] = PERSONAS.map(p => PERSONA_FOCUS[p]);
