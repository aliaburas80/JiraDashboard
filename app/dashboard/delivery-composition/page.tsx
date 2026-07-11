import { redirect } from 'next/navigation';

// Delivery Composition was merged into Data Quality 2026-07-12 — its
// completion donut now lives as a section on that page, alongside the
// existing field-confidence score.
export default function DeliveryCompositionRedirect() {
  redirect('/dashboard/data-quality');
}
