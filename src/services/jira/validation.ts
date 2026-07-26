// © 2025 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
import { ESSENTIAL_FIELDS } from './parser';

export function validateIssueData(issues: Record<string, unknown>[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(issues) || !issues.length) {
    errors.push('Uploaded file contains no issue rows.');
    return { isValid: false, errors };
  }

  const headerFields = issues.length ? Object.keys(issues[0]) : [];
  const missingFields = ESSENTIAL_FIELDS.filter((field: string) => !headerFields.includes(field));
  if (missingFields.length) {
    errors.push(`Missing required Jira fields: ${missingFields.join(', ')}`);
  }

  return { isValid: errors.length === 0, errors };
}
