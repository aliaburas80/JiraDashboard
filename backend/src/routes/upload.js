// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
const express = require('express');
const multer = require('multer');
const { parseJiraFile } = require('../services/parser');
const { validateIssueData } = require('../utils/validation');
const { calculateDashboardMetrics } = require('../services/metrics');
const {
  appendImportLog,
  buildImportLog,
  exportImportLogsWorkbook,
  renderImportLogView,
  readImportLogs,
} = require('../services/importLogs');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please upload a Jira Excel or CSV export.' });
    }

    const parseResult = parseJiraFile(req.file);
    const { issues, warnings } = parseResult;
    const validation = validateIssueData(issues);

    if (!validation.isValid) {
      const importLog = appendImportLog(buildImportLog({
        file: req.file,
        parseResult,
        validation,
        status: 'validation_failed',
      }));

      return res.status(422).json({ error: 'Validation failed', details: validation.errors, importLog });
    }

    const metrics = calculateDashboardMetrics(issues);
    const importLog = appendImportLog(buildImportLog({
      file: req.file,
      parseResult,
      validation,
      metrics,
      status: 'success',
    }));

    return res.json({ issues, warnings, metrics, importLog });
  } catch (error) {
    console.error(error);
    if (req.file) {
      appendImportLog(buildImportLog({
        file: req.file,
        status: 'failed',
        error: error.message,
      }));
    }

    return res.status(500).json({ error: 'Unable to process Jira export file.' });
  }
});

router.get('/logs', (req, res) => {
  res.json({ logs: readImportLogs() });
});

router.get('/logs/view', (req, res) => {
  res.type('html').send(renderImportLogView(readImportLogs()));
});

router.get('/logs/export', (req, res) => {
  const logs = readImportLogs();
  const workbook = exportImportLogsWorkbook(logs);

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename="jira-import-logs.xlsx"');
  res.send(workbook);
});

module.exports = router;
