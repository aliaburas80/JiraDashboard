import { redirect } from 'next/navigation';

// Smart Actions was merged into Priority Attention 2026-07-11 — its
// recommendations are generated from the same blocked/overdue/orphan/capacity
// signals already shown there, so it now lives as a section on that page.
export default function SmartActionsRedirect() {
  redirect('/dashboard/priority-attention');
}
