// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
const { ESSENTIAL_FIELDS } = require('../services/parser');

function validateIssueData(issues) {
  const errors = [];

  if (!Array.isArray(issues) || !issues.length) {
    errors.push('Uploaded file contains no issue rows.');
  }

  const headerFields = issues.length ? Object.keys(issues[0]) : [];
  const missingFields = ESSENTIAL_FIELDS.filter((field) => !headerFields.includes(field));
  if (missingFields.length) {
    errors.push(`Missing required Jira fields: ${missingFields.join(', ')}`);
  }

  return { isValid: errors.length === 0, errors };
}

module.exports = { validateIssueData };
