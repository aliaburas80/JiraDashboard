// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// Marquee — two infinite capability tickers scrolling in opposite directions
// for a layered, dynamic feel. Pure CSS animation (no JS), each row's track
// duplicated for a seamless loop. Decorative: the same words appear as real,
// readable text elsewhere on the page, so the marquee is marked aria-hidden to
// avoid screen-reader repetition. Honours reduced-motion (animation disabled in
// the module).

import styles from './Marquee.module.scss';

interface MarqueeProps {
  items: string[];
}

function Row({ items, reverse }: { items: string[]; reverse?: boolean }) {
  return (
    <div className={reverse ? `${styles.track} ${styles.reverse}` : styles.track}>
      {[0, 1].map((copy) => (
        <ul key={copy} className={styles.group}>
          {items.map((item) => (
            <li key={`${copy}-${item}`} className={styles.item}>
              <span className={styles.dot} aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      ))}
    </div>
  );
}

export default function Marquee({ items }: MarqueeProps) {
  // Second row offset so the two rows don't read as mirror copies.
  const offset = [...items.slice(Math.floor(items.length / 2)), ...items.slice(0, Math.floor(items.length / 2))];

  return (
    <div className={styles.marquee} aria-hidden="true">
      <Row items={items} />
      <Row items={offset} reverse />
    </div>
  );
}
