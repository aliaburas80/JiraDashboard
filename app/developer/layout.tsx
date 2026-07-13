'use client';
import { useRouter } from 'next/navigation';
import DashboardTopbar from '@/components/dashboard/DashboardTopbar';
import styles from './layout.module.scss';

export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <div className={styles.shell}>
      <a href="#main-content" className={styles.skipLink}>Skip to main content</a>
      <DashboardTopbar onNewUpload={() => router.push('/')} />
      <div id="main-content" className={styles.body}>{children}</div>
    </div>
  );
}
