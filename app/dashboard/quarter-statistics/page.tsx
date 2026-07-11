import { redirect } from 'next/navigation';

// Quarter Statistics was merged with Sprint Status into Trends 2026-07-11 —
// both pages answered "how are we trending over time," just at different
// granularity, so they're now one page with a Sprints/Quarters toggle.
export default function QuarterStatisticsRedirect() {
  redirect('/dashboard/trends');
}
