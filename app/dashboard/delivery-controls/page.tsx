import { redirect } from 'next/navigation';

// Delivery Controls was removed 2026-07-11 — every widget it showed (WIP/
// blocked/aging gauges, flow efficiency card) duplicated content already on
// Priority Attention and Key Metrics.
export default function DeliveryControlsRedirect() {
  redirect('/dashboard/key-metrics');
}
