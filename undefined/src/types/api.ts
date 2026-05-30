import type { DashboardMetrics } from './metrics';

export interface ApiError { error: string; details?: string[]; code?: number; }
export interface UploadResponse { metrics: DashboardMetrics; warnings: string[]; importLog: ImportLogEntry; }
export interface ImportsResponse { logs: ImportLogEntry[]; }
export type ApiResponse<T> = T | ApiError;

export interface ImportLogEntry {
  id: string; timestamp: string; filename: string; filesize: number;
  sheetName: string; rowCount: number; headers: string[];
  warnings: string[]; status: 'success' | 'validation_failed' | 'failed';
  error?: string;
}
