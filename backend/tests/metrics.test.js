const assert = require('assert');
const { calculateDashboardMetrics } = require('../src/services/metrics');

const mockIssues = [
  { 'Status': 'Done', 'Blocked Flag': false, 'Issue Type': 'Story', 'Customer Visible': 'true', 'Effort Confidence': '4' },
  { 'Status': 'In Progress', 'Blocked Flag': true, 'Issue Type': 'Defect', 'Customer Visible': 'false', 'Effort Confidence': '3' },
  { 'Status': 'Done', 'Blocked Flag': false, 'Issue Type': 'Bug', 'Customer Visible': 'true', 'Effort Confidence': '5' }
];

const metrics = calculateDashboardMetrics(mockIssues);

assert.strictEqual(metrics.totalIssues, 3);
assert.strictEqual(metrics.doneIssues, 2);
assert.strictEqual(metrics.blockedIssues, 1);
assert.strictEqual(metrics.openDefects, 1);
assert.strictEqual(metrics.totalCustomerVisible, 2);
assert.strictEqual(metrics.customerVisibleProgress, 100);
assert.strictEqual(metrics.overallDeliveryConfidence, 4);

console.log('metrics.test.js passed');
