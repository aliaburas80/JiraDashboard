'use client';
// P0B-06: starts the IndexedDB analytics event queue once on mount — flush
// timers, online/visibilitychange listeners, and the trackEvent() transport
// swap (src/lib/analytics/eventFlush.ts). Rendered in the root layout so it
// covers every page, mirroring GlobalErrorHandler.tsx's exact pattern.
import { useEffect } from 'react';
import { initAnalyticsQueue } from '@/lib/analytics/eventFlush';

export function AnalyticsQueueInit() {
  useEffect(() => {
    initAnalyticsQueue();
  }, []);
  return null;
}
