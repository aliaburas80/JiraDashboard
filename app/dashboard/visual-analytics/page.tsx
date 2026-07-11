import { redirect } from 'next/navigation';

// Visual Analytics was removed 2026-07-11 — its status/type/assignee/health
// distribution charts duplicated content already on Delivery Composition,
// Labels & Types, and Ownership & Capacity.
export default function VisualAnalyticsRedirect() {
  redirect('/dashboard/delivery-composition');
}
