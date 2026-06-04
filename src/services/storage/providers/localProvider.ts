// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Local file-system storage provider — wraps the existing data/ directory.

import fs   from 'fs';
import path from 'path';
import type { StorageProvider, CloudObject } from '@/types/storage';

const CLOUD_DIR = path.join(process.cwd(), 'data', 'cloud-backups');

export class LocalStorageProvider implements StorageProvider {
  readonly type = 'local' as const;

  private ensureDir() {
    if (!fs.existsSync(CLOUD_DIR)) fs.mkdirSync(CLOUD_DIR, { recursive: true });
  }

  async upload(key: string, content: Buffer | string): Promise<string> {
    this.ensureDir();
    const filePath = path.join(CLOUD_DIR, path.basename(key));
    fs.writeFileSync(filePath, content);
    return key;
  }

  async download(key: string): Promise<string> {
    const filePath = path.join(CLOUD_DIR, path.basename(key));
    if (!fs.existsSync(filePath)) throw new Error(`File not found: ${key}`);
    return fs.readFileSync(filePath, 'utf-8');
  }

  async list(_prefix?: string): Promise<CloudObject[]> {
    this.ensureDir();
    try {
      return fs.readdirSync(CLOUD_DIR).map(name => {
        const stat = fs.statSync(path.join(CLOUD_DIR, name));
        return { key: name, size: stat.size, lastModified: stat.mtime.toISOString() };
      });
    } catch { return []; }
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(CLOUD_DIR, path.basename(key));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  async test(): Promise<{ ok: true } | { ok: false; error: string }> {
    try {
      this.ensureDir();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  }
}
