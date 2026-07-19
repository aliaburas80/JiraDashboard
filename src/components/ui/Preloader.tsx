import Image from 'next/image';
import clsx from 'clsx';
import styles from './Preloader.module.scss';

export default function Preloader({ message, fullScreen = false }: { message?: string; fullScreen?: boolean }) {
  return (
    <div
      className={clsx(styles.wrap, fullScreen && styles.fullScreen)}
      role="status"
      aria-live="polite"
      aria-label={message ?? 'Loading'}
    >
      <Image
        src="/logo/delivery-clarity-logo-icon.svg"
        alt=""
        width={40}
        height={40}
        priority
        className={styles.mark}
      />
      <span className={styles.wordmark}>Delivery Clarity</span>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
}
