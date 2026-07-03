'use client';
// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// EP-014 / EP-I18N-01: Privacy Policy — fully data-driven, all content in every language.

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AnimatedDataBackground } from '@/components/ui/AnimatedDataBackground';
import { LanguageSwitcher } from '@/components/legal/LanguageSwitcher';
import { DownloadPdfButton } from '@/components/legal/DownloadPdfButton';
import { translations, LANGUAGES, DEFAULT_LANG, type LangCode, type Block } from '@/lib/legal-i18n';
import { FontSizeControl } from '@/components/legal/FontSizeControl';
import styles from './page.module.scss';

const EFFECTIVE_DATE = '3 July 2026';
const VERSION        = 'v1';
const CONTACT_EMAIL  = 'aliaburas80@gmail.com';

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

function PrivacyContent() {
  const params  = useSearchParams();
  const rawLang = params.get('lang') ?? DEFAULT_LANG;
  const lang    = (rawLang in LANGUAGES ? rawLang : DEFAULT_LANG) as LangCode;
  const t       = translations[lang];
  const dir     = LANGUAGES[lang].dir;

  return (
    <div className={styles.page} dir={dir}>
      <AnimatedDataBackground className={styles.bg} />

      <div id="privacy-body" className={styles.inner}>
        {/* Actions bar */}
        <div className={styles.pageActions}>
          <Link href="/register" className={styles.back}>{t.ui.backToRegister}</Link>
          <div className={styles.actionButtons}>
            <FontSizeControl targetId="privacy-body" />
            <LanguageSwitcher current={lang} selectLabel={t.ui.selectLanguage} />
            <DownloadPdfButton label={t.ui.downloadPdf} />
          </div>
        </div>

        {/* Header */}
        <p className={styles.badge}>{t.privacy.badge} {VERSION}</p>
        <h1 className={styles.title}>{t.privacy.title}</h1>
        <p className={styles.meta}>
          {t.ui.effectiveDate}: {EFFECTIVE_DATE} · {t.ui.version} {VERSION}<br />
          {t.ui.controller}: Ali Abu Ras ·{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>

        {/* Intro */}
        <div className={styles.section}>
          <div className={styles.body}>
            <p>{t.privacy.intro}</p>
          </div>
        </div>
        <div className={styles.divider} />

        {/* All sections from translation data */}
        {t.privacy.sections.map((section, si) => (
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
          <strong>{t.ui.supervisoryAuthority}</strong><br />
          Information Commissioner&rsquo;s Office (ICO) ·{' '}
          <a href="https://ico.org.uk" target="_blank" rel="noopener noreferrer">ico.org.uk</a><br /><br />
          <Link href="/terms">{t.ui.readTerms}</Link>
        </div>
      </div>
    </div>
  );
}

export default function PrivacyPage() {
  return <Suspense><PrivacyContent /></Suspense>;
}
