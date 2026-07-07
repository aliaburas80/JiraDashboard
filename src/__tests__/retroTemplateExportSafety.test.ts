// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Retro template workbook export safety tests — TC-SEC-CSV-12

import * as XLSX from 'xlsx';
import { downloadRetroExcelTemplate } from '../services/retro/retroTemplate.service';

const writeFileMock = jest.fn();
jest.mock('xlsx', () => ({
  ...jest.requireActual('xlsx'),
  writeFile: (...args: unknown[]) => writeFileMock(...args),
}));

beforeEach(() => writeFileMock.mockClear());

test('TC-SEC-CSV-12: retro workbook template keeps static example cells non-formula and unchanged', () => {
  downloadRetroExcelTemplate();

  const [workbook, filename] = writeFileMock.mock.calls[0] as [XLSX.WorkBook, string];
  expect(filename).toBe('Retrospective_Template.xlsx');
  expect(workbook.Sheets.Retrospective.A2.v).toBe('Sprint 42');
  expect(workbook.Sheets.Retrospective.F2.v).toBe('Good team collaboration');
  expect(workbook.Sheets.Instructions.A1.v).toBe('Retrospective Template — Instructions');
  expect(String(workbook.Sheets.Retrospective.A2.v)).not.toMatch(/^['=+\-@\t\r]/);
});
