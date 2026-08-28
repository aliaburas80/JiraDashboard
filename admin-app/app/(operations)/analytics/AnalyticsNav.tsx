'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/analytics', label: 'Overview' },
  { href: '/analytics/users', label: 'User flows' },
  { href: '/analytics/behavior', label: 'Behavior & hotspots' },
  { href: '/analytics/teams', label: 'Teams' },
] as const;

export function AnalyticsNav() {
  const pathname = usePathname();
  return (
    <nav className="analytics-periods" aria-label="Product analytics sections">
      {TABS.map(tab => {
        const active = tab.href === '/analytics'
          ? pathname === '/analytics'
          : pathname?.startsWith(tab.href);
        return <Link key={tab.href} href={tab.href} className={active ? 'active' : ''}>{tab.label}</Link>;
      })}
    </nav>
  );
}
