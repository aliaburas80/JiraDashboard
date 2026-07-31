// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// EP-011: professional personas for user registration.
// These are analytics/routing attributes, not permission roles.

// EP-014: bump this string when Terms or Privacy Policy changes materially.
// Users who accepted an older version must re-consent before their next upload.
export const CURRENT_TERMS_VERSION = 'v1';

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
