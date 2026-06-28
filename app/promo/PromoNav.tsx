// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// PromoNav — sticky top navigation for the public /promo page.
//  • Gains a blurred background once the user scrolls past the hero.
//  • Smooth-scrolls to in-page sections (the "page transition" between
//    sections), falling back to an instant jump under reduced-motion.
//  • Collapses to an accessible toggle menu on small screens.
'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import styles from './PromoNav.module.scss';

const LINKS = [
  { href: '#why', label: 'Why' },
  { href: '#capabilities', label: 'Capabilities' },
  { href: '#how', label: 'How it works' },
  { href: '#security', label: 'Security' },
] as const;

export default function PromoNav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  function handleNav(event: React.MouseEvent<HTMLAnchorElement>, href: string) {
    const target = document.querySelector(href);
    if (!target) return; // let the browser handle it if the anchor is missing
    event.preventDefault();
    setMenuOpen(false);
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth', block: 'start' });
  }

  return (
    <header className={clsx(styles.nav, scrolled && styles.scrolled)}>
      <div className={styles.inner}>
        <a className={styles.brand} href="#top" onClick={(e) => handleNav(e, '#top')} aria-label="Delivery Clarity — top of page">
          <span className={styles.brandMark} aria-hidden="true">
            <svg viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="15" />
              <path d="M11 22.5 15.5 13l9.5-4.5-4.5 9.5-9.5 4.5Z" />
              <circle cx="18" cy="15.5" r="2.3" />
            </svg>
          </span>
          <span className={styles.brandName}>Delivery Clarity</span>
        </a>

        <nav className={styles.links} aria-label="Primary">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className={styles.link} onClick={(e) => handleNav(e, link.href)}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className={styles.actions}>
          <a className={styles.cta} href="/login">
            Open the app
          </a>
          <button
            type="button"
            className={styles.menuToggle}
            aria-expanded={menuOpen}
            aria-controls="promo-mobile-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className={clsx(styles.menuBar, menuOpen && styles.menuBarOpenTop)} />
            <span className={clsx(styles.menuBar, menuOpen && styles.menuBarOpenMid)} />
            <span className={clsx(styles.menuBar, menuOpen && styles.menuBarOpenBot)} />
          </button>
        </div>
      </div>

      <div id="promo-mobile-menu" className={clsx(styles.mobileMenu, menuOpen && styles.mobileMenuOpen)} hidden={!menuOpen}>
        {LINKS.map((link) => (
          <a key={link.href} href={link.href} className={styles.mobileLink} onClick={(e) => handleNav(e, link.href)}>
            {link.label}
          </a>
        ))}
        <a className={styles.mobileCta} href="/login">
          Open the app
        </a>
      </div>
    </header>
  );
}
