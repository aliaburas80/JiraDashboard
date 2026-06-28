// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Marquee — an infinite horizontal capability ticker. Pure CSS animation (no
// JS), duplicated track for a seamless loop. Decorative: the same words appear
// as real, readable text elsewhere on the page, so the marquee is marked
// aria-hidden to avoid screen-reader repetition. Honours reduced-motion (the
// animation is disabled in the module).

import styles from './Marquee.module.scss';

interface MarqueeProps {
  items: string[];
}

export default function Marquee({ items }: MarqueeProps) {
  return (
    <div className={styles.marquee} aria-hidden="true">
      <div className={styles.track}>
        {[0, 1].map((copy) => (
          <ul key={copy} className={styles.group}>
            {items.map((item) => (
              <li key={`${copy}-${item}`} className={styles.item}>
                <span className={styles.dot} />
                {item}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}
