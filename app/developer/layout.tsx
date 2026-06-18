'use client';
import { useRouter } from 'next/navigation';
import DashboardTopbar from '@/components/dashboard/DashboardTopbar';
import styles from './layout.module.scss';

export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <div className={styles.shell}>
      <DashboardTopbar onNewUpload={() => router.push('/')} />
      <div className={styles.body}>{children}</div>
    </div>
  );
}
