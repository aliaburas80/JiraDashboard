import type { ReactNode } from 'react';
import { AnalyticsNav } from './AnalyticsNav';

export default function AnalyticsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AnalyticsNav />
      {children}
    </>
  );
}
