// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Regression tests for a real reported bug (2026-07-04): an admin saved a custom
// SMTP "From address" via Admin > Settings and it kept reverting to the value
// baked into SMTP_* env vars. Root causes: (1) getAppConfig()'s cloud-blob path
// unconditionally overrode an explicitly-saved cloud SMTP config with env vars
// whenever SMTP_USER/SMTP_PASS were set, and (2) the DB save silently failed
// whenever the password field was left blank on a first-ever save (no existing
// row to fall back to), so the DB path never became authoritative.

export {};

jest.mock('@/services/smtp/smtpSettings.service', () => ({
  getSmtpConfig: jest.fn(async () => null), // force the DB path to miss, exercising the cloud-blob path
}));

const mockDownload = jest.fn();
jest.mock('@/services/storage/storageProvider', () => ({
  readStorageSettings: jest.fn(() => ({ active: 's3' })),
  createProvider: jest.fn(async () => ({ download: mockDownload })),
}));

import { encryptConfig, getAppConfig, invalidateConfig, type AppConfig } from '../lib/app-config';

const SECRET = 'test-config-encryption-key-0123456789';

function mockCloudConfig(config: AppConfig) {
  const d = encryptConfig(config, SECRET);
  mockDownload.mockResolvedValue(JSON.stringify({ v: 1, d }));
}

const savedConfig: AppConfig = {
  smtp: { host: 'smtp.gmail.com', port: 587, user: 'aliaburas80@gmail.com', pass: 'app-password', from: 'Delivery Clarity <noreply@deliveryclarity.app>' },
  jira: { apiToken: 'saved-jira-token' },
  appUrl: 'https://deliveryclarity.app',
};

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  invalidateConfig();
  jest.clearAllMocks();
  process.env = { ...ORIGINAL_ENV };
  process.env.CONFIG_ENCRYPTION_KEY = SECRET;
});

afterAll(() => { process.env = ORIGINAL_ENV; });

test('TC-CFG-01: an explicitly-saved cloud "from" address is NOT overridden by SMTP_* env vars', async () => {
  process.env.SMTP_USER = 'aliaburas80@gmail.com';
  process.env.SMTP_PASS = 'env-password';
  process.env.SMTP_FROM = 'Delivery Clarity <aliaburas80@gmail.com>'; // the value it kept reverting to
  mockCloudConfig(savedConfig);

  const cfg = await getAppConfig();

  expect(cfg.smtp.from).toBe('Delivery Clarity <noreply@deliveryclarity.app>');
  expect(cfg.smtp.host).toBe('smtp.gmail.com');
});

test('TC-CFG-02: an explicitly-saved cloud Jira token is NOT overridden by an env token', async () => {
  process.env.GATEWAY_JIRA_API_TOKEN = 'env-jira-token';
  mockCloudConfig(savedConfig);

  const cfg = await getAppConfig();

  expect(cfg.jira.apiToken).toBe('saved-jira-token');
});

test('TC-CFG-03: env vars still bootstrap SMTP config when the cloud config has nothing saved yet', async () => {
  process.env.SMTP_USER = 'aliaburas80@gmail.com';
  process.env.SMTP_PASS = 'env-password';
  process.env.SMTP_FROM = 'Delivery Clarity <aliaburas80@gmail.com>';
  mockCloudConfig({
    smtp: { host: '', port: 587, user: '', pass: '', from: '' }, // nothing saved yet
    jira: { apiToken: '' },
    appUrl: '',
  });

  const cfg = await getAppConfig();

  expect(cfg.smtp.user).toBe('aliaburas80@gmail.com');
  expect(cfg.smtp.from).toBe('Delivery Clarity <aliaburas80@gmail.com>');
});
