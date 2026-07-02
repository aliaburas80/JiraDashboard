// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// EP-011: professional personas for user registration.
// These are analytics/routing attributes, not permission roles.

export const PERSONAS = [
  'Scrum Master',
  'Agile Coach',
  'Product Owner',
  'Project Manager',
  'Delivery Manager',
  'Engineering Manager',
  'Team Lead',
  'Executive',
  'Jira Administrator',
  'Consultant',
  'Other',
] as const;

export type Persona = typeof PERSONAS[number];
