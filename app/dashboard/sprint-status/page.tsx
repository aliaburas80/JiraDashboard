import { redirect } from 'next/navigation';

// Sprint Status was merged with Quarter Statistics into Trends 2026-07-11 —
// both pages answered "how are we trending over time," just at different
// granularity, so they're now one page with a Sprints/Quarters toggle.
export default function SprintStatusRedirect() {
  redirect('/dashboard/trends');
}
