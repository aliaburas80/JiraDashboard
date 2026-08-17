// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
import type { ExportFormat } from '@/config/exportCatalog';

export interface ExportMetadataInput {
  format: ExportFormat;
  reportName?: string;
  reportingPeriod?: string;
  generatedAt?: Date;
}

export interface ExportMetadata {
  filename: string;
  creator: 'Delivery Clarity';
  reportName: string;
  reportingPeriod?: string;
  generatedAt: string;
}

function slug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'delivery-report';
}

export function buildExportMetadata(input: ExportMetadataInput): ExportMetadata {
  const generatedAt = input.generatedAt ?? new Date();
  const reportName = input.reportName?.trim() || 'Delivery Report';
  const date = generatedAt.toISOString().slice(0, 10);
  const period = input.reportingPeriod?.trim();
  const periodPart = period ? `-${slug(period)}` : '';

  return {
    filename: `${slug(reportName)}${periodPart}-${date}.${input.format}`,
    creator: 'Delivery Clarity',
    reportName,
    reportingPeriod: period || undefined,
    generatedAt: generatedAt.toISOString(),
  };
}
