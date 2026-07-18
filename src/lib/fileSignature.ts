// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
//
// Lightweight content-signature / sanity checks for uploaded files, run as an
// early, cheap gate BEFORE the real parsers (XLSX.read via parseJiraFile /
// parseRetroFile, and the profile-image storage call) — never a replacement
// for them.
//
// Deliberately dependency-free (CLAUDE.md §4.7 — a new npm package is not
// justified for a handful of magic-byte comparisons): only buffer-prefix
// checks and a printable-byte-ratio heuristic, no file-type-sniffing library.
//
// Scope note (Jira import files — .csv/.xlsx/.xls): XLSX.read() already
// sniffs actual content format rather than trusting the extension (confirmed
// in docs/product-audit/10-technical-cleanup.md Part 1, "Checked and
// confirmed clean"), so this module is defense-in-depth ahead of that parser,
// not the only content-validation layer. It is deliberately LENIENT for
// `.xls` (and the text-oriented `.csv`/`.md`/`.txt`): some real Jira "Excel"
// exports are actually tab- or HTML-formatted text saved with an `.xls`
// extension (a long-standing Jira export quirk) — XLSX.read already tolerates
// this downstream, so a strict OLE-only signature check for `.xls` would
// reject legitimate files. Only `.xlsx` gets a strict check, because a
// genuine .xlsx is always a ZIP/OOXML archive with no legitimate exception.

/** Matches a buffer's leading bytes against a fixed signature. */
function matchesSignature(buffer: Buffer, signature: number[]): boolean {
  if (buffer.length < signature.length) return false;
  return signature.every((byte, i) => buffer[i] === byte);
}

const ZIP_SIGNATURES: number[][] = [
  [0x50, 0x4b, 0x03, 0x04], // normal archive
  [0x50, 0x4b, 0x05, 0x06], // empty archive
  [0x50, 0x4b, 0x07, 0x08], // spanned archive
];

const OLE_SIGNATURE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];

/** True when the buffer starts with a ZIP local-file-header signature (OOXML/.xlsx container format). */
export function hasZipSignature(buffer: Buffer): boolean {
  return ZIP_SIGNATURES.some((sig) => matchesSignature(buffer, sig));
}

/** True when the buffer starts with the legacy OLE/CFB signature (binary .xls / .doc / .ppt container format). */
export function hasOleSignature(buffer: Buffer): boolean {
  return matchesSignature(buffer, OLE_SIGNATURE);
}

/**
 * True if the first `sampleSize` bytes look like plausible text content
 * (no NUL bytes, low ratio of non-printable control bytes). A cheap sanity
 * gate for CSV/Markdown/plain-text uploads — not a full encoding validator,
 * and intentionally permissive of non-ASCII (UTF-8 multibyte, accented
 * names, non-English labels) since Jira exports are not English-only.
 */
export function looksLikeText(buffer: Buffer, sampleSize = 4096): boolean {
  if (buffer.length === 0) return false;
  const sample = buffer.subarray(0, Math.min(sampleSize, buffer.length));
  let controlBytes = 0;
  for (const byte of sample) {
    if (byte === 0x00) return false; // NUL byte — never valid in text content
    const isPrintableOrWhitespace =
      byte === 0x09 || byte === 0x0a || byte === 0x0d || (byte >= 0x20 && byte !== 0x7f);
    if (!isPrintableOrWhitespace) controlBytes += 1;
  }
  return controlBytes / sample.length < 0.05;
}

/**
 * Validates a buffer's actual content against the extension the caller
 * claims it has. Returns a user-safe rejection reason, or null when the
 * content passes the sanity gate. Extensions not recognised here return
 * null (validation is left to the caller's own ALLOWED_EXTENSIONS gate).
 */
export function validateFileSignature(buffer: Buffer, extension: string): string | null {
  const ext = extension.toLowerCase();

  if (ext === '.xlsx') {
    if (!hasZipSignature(buffer)) {
      return 'This file has a .xlsx extension but its content is not a valid Excel (.xlsx) file.';
    }
    return null;
  }

  if (ext === '.xls') {
    // Lenient: accept genuine binary XLS (OLE) OR plausible text content —
    // see module-level note on Jira's fake-.xls export quirk.
    if (hasOleSignature(buffer) || looksLikeText(buffer)) return null;
    return 'This file has a .xls extension but its content is neither a valid Excel file nor readable text.';
  }

  if (ext === '.csv' || ext === '.md' || ext === '.txt') {
    if (looksLikeText(buffer)) return null;
    return `This file has a "${ext}" extension but its content does not look like text.`;
  }

  return null;
}

// ---------------------------------------------------------------------------
// Image content-signature detection (profile image upload)
// ---------------------------------------------------------------------------

export type DetectedImageType = 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif';

/**
 * Detects an image's real format from its magic bytes, ignoring any
 * client-declared MIME type. Returns null when the content does not match
 * any of the supported formats (including a deliberate non-match for
 * image/svg+xml — SVG is XML/text with no fixed magic-byte signature to
 * check, and is excluded from the allowed profile-image formats app-wide to
 * prevent stored-SVG-XSS; that exclusion is unrelated to this function and
 * is enforced by the caller's own allow-list, not here).
 */
export function detectImageContentType(buffer: Buffer): DetectedImageType | null {
  if (matchesSignature(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (matchesSignature(buffer, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (
    matchesSignature(buffer, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) ||
    matchesSignature(buffer, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61])
  ) {
    return 'image/gif';
  }
  if (
    buffer.length >= 12 &&
    matchesSignature(buffer, [0x52, 0x49, 0x46, 0x46]) && // 'RIFF'
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50 // 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}
