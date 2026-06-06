// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.

export type ColumnStatus = 'mapped' | 'aliased' | 'missing' | 'unrecognised';

export interface ColumnEntry {
  original:  string;          // column name as it appears in the file
  canonical: string;          // column name after alias resolution
  status:    ColumnStatus;
  isEssential:  boolean;
  isImportant:  boolean;      // optional but affects key metrics
}

export interface ColumnMappingResult {
  totalInFile:      number;
  totalMapped:      number;
  totalAliased:     number;
  totalUnrecognised: number;
  missingEssential: string[];
  missingImportant: string[];
  columns:          ColumnEntry[];
  mappingScore:     number;   // 0–100 — how well the file mapped
  sheetName:        string;
}
