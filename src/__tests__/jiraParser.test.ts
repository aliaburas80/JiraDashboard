// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// EP-017: parseJiraFile must accept an ArrayBuffer (browser File.arrayBuffer()
// output, used by the local-storage-mode upload path in app/page.tsx) in
// addition to the Node Buffer it always received from POST /api/upload.

import * as XLSX from 'xlsx';
import { parseJiraFile } from '../services/jira/parser';

function buildWorkbookBuffer(): Buffer {
  const rows = [
    { 'Issue Key': 'PROJ-1', 'Issue Type': 'Story', Summary: 'First issue', Status: 'Done' },
    { 'Issue Key': 'PROJ-2', 'Issue Type': 'Bug', Summary: 'Second issue', Status: 'In Progress' },
  ];
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

test('TC-PARSE-01: parseJiraFile parses a Node Buffer (existing server upload path)', () => {
  const buffer = buildWorkbookBuffer();
  const result = parseJiraFile({ buffer, originalname: 'export.xlsx' });

  expect(result.issues).toHaveLength(2);
  expect(result.issues[0]['Issue Key']).toBe('PROJ-1');
});

test('TC-PARSE-02: parseJiraFile parses an ArrayBuffer identically to the equivalent Buffer (local-mode browser path)', () => {
  const buffer = buildWorkbookBuffer();
  const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;

  const fromBuffer = parseJiraFile({ buffer, originalname: 'export.xlsx' });
  const fromArrayBuffer = parseJiraFile({ buffer: arrayBuffer, originalname: 'export.xlsx' });

  expect(fromArrayBuffer.issues).toEqual(fromBuffer.issues);
  expect(fromArrayBuffer.headers).toEqual(fromBuffer.headers);
  expect(fromArrayBuffer.sheetName).toEqual(fromBuffer.sheetName);
});
