import Image from 'next/image';
import clsx from 'clsx';
import styles from './Preloader.module.scss';

type PreloaderProps = {
  message?: string;
  fullScreen?: boolean;
};

export default function Preloader({ message, fullScreen = false }: PreloaderProps) {
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
      <div className={styles.track} aria-hidden="true">
        <div className={styles.indicator} />
      </div>
      {message && <p className={styles.message}>{message}</p>}
    </div>
  );
}
