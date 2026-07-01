'use client';
// Installs window.onerror and unhandledrejection handlers once on mount.
// Rendered in the root layout so it covers every page.
import { useEffect } from 'react';
import { installGlobalErrorHandlers } from '@/lib/errorReporter';

export function GlobalErrorHandler() {
  useEffect(() => {
    installGlobalErrorHandlers();
  }, []);
  return null;
}
