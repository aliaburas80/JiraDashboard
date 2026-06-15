// Redirect legacy /summary → /dashboard/summary (canonical route in dashboard shell).
// External links and bookmarks are preserved via this permanent redirect.
import { redirect } from 'next/navigation';

export default function SummaryRedirect() {
  redirect('/dashboard/summary');
}
