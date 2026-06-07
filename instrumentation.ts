// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Next.js instrumentation — runs once when the server starts.
// Checks local database state and auto-restores from cloud if needed.
// https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
//
export async function register() {
  // Only run on the Node.js runtime (not Edge)
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  console.log('[Delivery Clarity] Server starting — checking database state…');

  try {
    const { autoRestoreFromCloud } = await import('@/services/storage/autoRestore');
    const result = await autoRestoreFromCloud();

    switch (result.action) {
      case 'skipped':
        console.log(`[AutoRestore] ✓ ${result.reason}`);
        break;
      case 'no-provider':
        console.log(`[AutoRestore] ℹ ${result.reason}`);
        break;
      case 'no-backups':
        console.log(`[AutoRestore] ℹ ${result.reason}`);
        break;
      case 'restored':
        console.log(`[AutoRestore] ✓ Restored from cloud: ${result.key}`);
        console.log(`[AutoRestore]   Files restored: ${result.restored?.join(', ')}`);
        break;
      case 'failed':
        console.error(`[AutoRestore] ✗ ${result.reason}`);
        if (result.error) console.error(`[AutoRestore]   Error: ${result.error}`);
        break;
    }
  } catch (e) {
    // Never crash the server on auto-restore failure
    console.error('[AutoRestore] Unexpected error during startup check:', e);
  }
}
