'use client';
// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// EP-014 / EP-I18N-01: Terms of Use — fully data-driven, all content in every language.

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AnimatedDataBackground } from '@/components/ui/AnimatedDataBackground';
import { LanguageSwitcher } from '@/components/legal/LanguageSwitcher';
import { DownloadPdfButton } from '@/components/legal/DownloadPdfButton';
import { translations, LANGUAGES, DEFAULT_LANG, type LangCode, type Block } from '@/lib/legal-i18n';
import styles from './page.module.scss';

const EFFECTIVE_DATE = '3 July 2026';
const VERSION        = 'v1';
const CONTACT_EMAIL  = 'aliaburas80@gmail.com';

// ── Block renderer ────────────────────────────────────────────────────────────

function RenderBlock({ block, idx }: { block: Block; idx: number }) {
  if ('p'    in block) return <p key={idx}>{block.p}</p>;
  if ('b'    in block) return <p key={idx}><strong>{block.b}</strong></p>;
  if ('note' in block) return <p key={idx} className={styles.note}>{block.note}</p>;
  if ('ul'   in block) return (
    <ul key={idx}>
      {block.ul.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
  );
  return null;
}

// ── Page ──────────────────────────────────────────────────────────────────────

function TermsContent() {
  const params  = useSearchParams();
  const rawLang = params.get('lang') ?? DEFAULT_LANG;
  const lang    = (rawLang in LANGUAGES ? rawLang : DEFAULT_LANG) as LangCode;
  const t       = translations[lang];
  const dir     = LANGUAGES[lang].dir;

  return (
    <div className={styles.page} dir={dir}>
      <AnimatedDataBackground className={styles.bg} />

      <div className={styles.inner}>
        {/* Actions bar */}
        <div className={styles.pageActions}>
          <Link href="/register" className={styles.back}>{t.ui.backToRegister}</Link>
          <div className={styles.actionButtons}>
            <LanguageSwitcher current={lang} selectLabel={t.ui.selectLanguage} />
            <DownloadPdfButton label={t.ui.downloadPdf} />
          </div>
        </div>

        {/* Header */}
        <p className={styles.badge}>{t.terms.badge} {VERSION}</p>
        <h1 className={styles.title}>{t.terms.title}</h1>
        <p className={styles.meta}>
          {t.ui.effectiveDate}: {EFFECTIVE_DATE} · {t.ui.version} {VERSION}<br />
          {t.ui.operator}: Ali Abu Ras ·{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>

        {/* Intro */}
        <div className={styles.section}>
          <div className={styles.body}>
            <p>{t.terms.intro}</p>
          </div>
        </div>
        <div className={styles.divider} />

        {/* All sections from translation data */}
        {t.terms.sections.map((section, si) => (
          <div key={si}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>{section.title}</h2>
              <div className={styles.body}>
                {section.blocks.map((block, bi) => (
                  <RenderBlock key={bi} block={block} idx={bi} />
                ))}
              </div>
            </div>
            <div className={styles.divider} />
          </div>
        ))}

        {/* Contact */}
        <div className={styles.contactBox}>
          <strong>{t.ui.contact}</strong><br />
          Ali Abu Ras · <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a><br /><br />
          <Link href="/privacy">{t.ui.readPrivacy}</Link>
        </div>
      </div>
    </div>
  );
}

export default function TermsPage() {
  return <Suspense><TermsContent /></Suspense>;
}
