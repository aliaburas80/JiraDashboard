'use client';
import { useRouter } from 'next/navigation';
import DashboardTopbar from '@/components/dashboard/DashboardTopbar';
import AdminNavSidebar from '@/components/admin/AdminNavSidebar';
import styles from './layout.module.scss';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <div className={styles.shell}>
      <DashboardTopbar onNewUpload={() => router.push('/')} />
      <div className={styles.body}>
        <AdminNavSidebar />
        <main className={styles.main} id="main-content">
          {children}
        </main>
      </div>
    </div>
  );
}
