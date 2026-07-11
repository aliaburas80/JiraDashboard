import { redirect } from 'next/navigation';

// Kanban Health was removed 2026-07-11 — its WIP/blocked/aging gauges and
// status-distribution chart duplicated content already on Priority Attention
// and Key Metrics; its one seemingly unique card read a data field the app
// never populates and never actually rendered.
export default function KanbanHealthRedirect() {
  redirect('/dashboard/key-metrics');
}
