import { buildExportMetadata } from '@/services/export/exportMetadata.service';

describe('buildExportMetadata', () => {
  it('creates a deterministic, filesystem-safe filename', () => {
    const result = buildExportMetadata({ format: 'xlsx', reportName: 'Team A / Weekly Delivery', reportingPeriod: 'Sprint 12', generatedAt: new Date('2026-08-18T00:00:00.000Z') });
    expect(result.filename).toBe('team-a-weekly-delivery-sprint-12-2026-08-18.xlsx');
    expect(result.creator).toBe('Delivery Clarity');
    expect(result.generatedAt).toBe('2026-08-18T00:00:00.000Z');
  });
});
