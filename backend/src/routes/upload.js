// © 2025 Ali Abu Ras — aburasali80@gmail.com. All rights reserved.
const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
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

// 20 MB file size limit — protects the server from very large uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.csv', '.xlsx', '.xls'];
    const ext = file.originalname.slice(file.originalname.lastIndexOf('.')).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error(`Unsupported file type "${ext}". Upload a .csv, .xlsx, or .xls Jira export.`));
  },
});

// 20 uploads per 15 minutes per IP — prevents abuse while allowing normal usage
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many uploads from this IP. Please wait 15 minutes before trying again.' },
});

router.post('/', uploadLimiter, (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File exceeds the 20 MB size limit. Export a smaller date range or reduce the number of columns.' });
    }
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, async (req, res) => {
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
