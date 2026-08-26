import * as XLSX from 'xlsx';
import { parseJiraFile } from '@/services/jira/parser';
import { calculateDashboardMetrics } from '@/services/metrics/metrics.service';

function jiraExport(rows: Record<string, unknown>[]): Buffer {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Issues');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

describe('Blocked workflow status normalization', () => {
  it('treats Blocked status as authoritative even when Blocked Flag is false or absent', () => {
    const parsed = parseJiraFile({
      originalname: 'blocked-status.xlsx',
      buffer: jiraExport([
        {
          'Issue Key': 'DC-1',
          'Issue Type': 'Story',
          Summary: 'Blocked with an explicit false custom flag',
          Status: 'Blocked',
          'Blocked Flag': false,
        },
        {
          'Issue Key': 'DC-2',
          'Issue Type': 'Bug',
          Summary: 'Blocked without a custom flag',
          Status: ' blocked ',
        },
        {
          'Issue Key': 'DC-3',
          'Issue Type': 'Story',
          Summary: 'Normal active work',
          Status: 'In Progress',
          'Blocked Flag': false,
        },
      ]),
    });

    expect(parsed.issues[0]['Blocked Flag']).toBe(true);
    expect(parsed.issues[1]['Blocked Flag']).toBe(true);
    expect(parsed.issues[2]['Blocked Flag']).toBe(false);

    const metrics = calculateDashboardMetrics(parsed.issues);
    expect(metrics.blockedIssues).toBe(2);
    expect(metrics.risk.blockedIssues).toBe(2);

    const dc1 = metrics.flow.items.find(item => item.key === 'DC-1');
    const dc2 = metrics.flow.items.find(item => item.key === 'DC-2');
    expect(dc1?.blocked).toBe(true);
    expect(dc2?.blocked).toBe(true);
  });
});
