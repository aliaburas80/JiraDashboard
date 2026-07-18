// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Unit tests for src/lib/fileSignature.ts — the content-signature / magic-byte
// gate added 2026-07-18 for docs/product-audit/10-technical-cleanup.md Part 1
// findings 3 (upload/retro content-signature check) and 4 (profile-image
// content verification).

import {
  hasZipSignature,
  hasOleSignature,
  looksLikeText,
  validateFileSignature,
  detectImageContentType,
} from '../lib/fileSignature';

const ZIP_BYTES = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00]);
const OLE_BYTES = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0x00, 0x00]);
const PNG_BYTES = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x00]);
const JPEG_BYTES = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
const GIF87_BYTES = Buffer.from('GIF87a', 'ascii');
const GIF89_BYTES = Buffer.from('GIF89a', 'ascii');
const WEBP_BYTES = Buffer.concat([
  Buffer.from('RIFF', 'ascii'),
  Buffer.from([0x00, 0x00, 0x00, 0x00]),
  Buffer.from('WEBP', 'ascii'),
]);

describe('hasZipSignature', () => {
  test('true for a ZIP local-file-header signature (.xlsx container format)', () => {
    expect(hasZipSignature(ZIP_BYTES)).toBe(true);
  });

  test('false for non-ZIP content', () => {
    expect(hasZipSignature(Buffer.from('plain text', 'utf8'))).toBe(false);
  });

  test('false for a buffer shorter than the signature', () => {
    expect(hasZipSignature(Buffer.from([0x50, 0x4b]))).toBe(false);
  });
});

describe('hasOleSignature', () => {
  test('true for the legacy OLE/CFB signature (binary .xls container format)', () => {
    expect(hasOleSignature(OLE_BYTES)).toBe(true);
  });

  test('false for non-OLE content', () => {
    expect(hasOleSignature(Buffer.from('plain text', 'utf8'))).toBe(false);
  });
});

describe('looksLikeText', () => {
  test('true for plausible CSV text', () => {
    expect(looksLikeText(Buffer.from('Issue Key,Status\nPROJ-1,Done\n', 'utf8'))).toBe(true);
  });

  test('true for non-ASCII UTF-8 content (Jira exports are not English-only)', () => {
    expect(looksLikeText(Buffer.from('اسم المشروع,الحالة\nPROJ-1,منجز\n', 'utf8'))).toBe(true);
  });

  test('false for a buffer containing a NUL byte', () => {
    expect(looksLikeText(Buffer.from([0x41, 0x42, 0x00, 0x43]))).toBe(false);
  });

  test('false for an empty buffer', () => {
    expect(looksLikeText(Buffer.alloc(0))).toBe(false);
  });

  test('false for binary-looking content (high ratio of control bytes)', () => {
    const binary = Buffer.from(Array.from({ length: 200 }, (_, i) => (i * 37) % 256).filter((b) => b !== 0));
    expect(looksLikeText(binary)).toBe(false);
  });
});

describe('validateFileSignature — .xlsx (strict)', () => {
  test('accepts real ZIP/OOXML content', () => {
    expect(validateFileSignature(ZIP_BYTES, '.xlsx')).toBeNull();
  });

  test('rejects content that is not a ZIP archive', () => {
    const result = validateFileSignature(Buffer.from('not a real xlsx', 'utf8'), '.xlsx');
    expect(result).not.toBeNull();
    expect(result).toContain('.xlsx');
  });
});

describe('validateFileSignature — .xls (lenient: OLE or text)', () => {
  test('accepts genuine binary OLE content', () => {
    expect(validateFileSignature(OLE_BYTES, '.xls')).toBeNull();
  });

  test('accepts plausible text content (real-world Jira "fake .xls" export quirk)', () => {
    expect(validateFileSignature(Buffer.from('Issue Key\tStatus\nPROJ-1\tDone\n', 'utf8'), '.xls')).toBeNull();
  });

  test('rejects genuinely binary garbage that is neither OLE nor text', () => {
    const binary = Buffer.from(Array.from({ length: 200 }, (_, i) => (i * 37) % 256).filter((b) => b !== 0));
    const result = validateFileSignature(binary, '.xls');
    expect(result).not.toBeNull();
  });
});

describe('validateFileSignature — .csv / .md / .txt (text sanity gate)', () => {
  test.each(['.csv', '.md', '.txt'])('%s accepts plausible text content', (ext) => {
    expect(validateFileSignature(Buffer.from('some,csv,text\n1,2,3\n', 'utf8'), ext)).toBeNull();
  });

  test.each(['.csv', '.md', '.txt'])('%s rejects binary garbage', (ext) => {
    const binary = Buffer.from(Array.from({ length: 200 }, (_, i) => (i * 37) % 256).filter((b) => b !== 0));
    const result = validateFileSignature(binary, ext);
    expect(result).not.toBeNull();
    expect(result).toContain(ext);
  });
});

describe('validateFileSignature — unrecognised extension', () => {
  test('returns null (left to the caller\'s own ALLOWED_EXTENSIONS gate)', () => {
    expect(validateFileSignature(Buffer.from('anything', 'utf8'), '.exe')).toBeNull();
  });
});

describe('detectImageContentType', () => {
  test('detects PNG from its magic bytes', () => {
    expect(detectImageContentType(PNG_BYTES)).toBe('image/png');
  });

  test('detects JPEG from its magic bytes', () => {
    expect(detectImageContentType(JPEG_BYTES)).toBe('image/jpeg');
  });

  test('detects GIF87a and GIF89a from their magic bytes', () => {
    expect(detectImageContentType(GIF87_BYTES)).toBe('image/gif');
    expect(detectImageContentType(GIF89_BYTES)).toBe('image/gif');
  });

  test('detects WEBP from its RIFF....WEBP magic bytes', () => {
    expect(detectImageContentType(WEBP_BYTES)).toBe('image/webp');
  });

  test('returns null for non-image content, regardless of any claimed type', () => {
    expect(detectImageContentType(Buffer.from('not an image', 'utf8'))).toBeNull();
  });

  test('returns null for a truncated/too-short buffer', () => {
    expect(detectImageContentType(Buffer.from([0x89, 0x50]))).toBeNull();
  });

  test('does not detect SVG (XML/text, no fixed magic-byte signature) — SVG stays excluded app-wide to prevent stored-SVG-XSS', () => {
    expect(detectImageContentType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>', 'utf8'))).toBeNull();
  });
});
