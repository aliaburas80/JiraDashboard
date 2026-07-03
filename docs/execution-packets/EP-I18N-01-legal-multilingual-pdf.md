# EP-I18N-01 — Multilingual Legal Pages + PDF Download

```
Execution Packet ID:   EP-I18N-01
Title:                 Multilingual Legal Pages + PDF Download
Priority:              P1 — Global accessibility and enterprise procurement
MVP Classification:    Launch quality — required for international registration
Dependencies:          EP-014 (terms/privacy exist), EP-VIS-01 (layout finalised)
Approved By:           Ali Abu Ras (Product Owner)
Status:                Ready for Codex
```

---

## Business Objective

Enterprise procurement and international users require:
1. Legal documents in their language (GDPR Article 12 requires clear, plain language)
2. A printable/downloadable PDF for IT security and legal review processes

Target markets: UAE/Saudi Arabia (Arabic, RTL), Russia (Russian), Japan (Japanese),
South Korea (Korean), Netherlands (Dutch), France (French), plus English default.

---

## Required Outcome

After this packet:

1. `/terms` and `/privacy` show a language switcher with 7 languages.
2. Selecting a language updates the URL (`?lang=ar`) and re-renders the page in that language.
3. Arabic triggers `dir="rtl"` on the content container.
4. A "Download PDF" button calls `window.print()` — browser opens print dialog.
5. A `@media print` stylesheet produces clean black-on-white paginated output
   with no animation, no navigation, no language switcher visible.
6. All machine-translated sections display a banner: "Automated translation —
   English version is legally binding."
7. The English version shows no translation banner.
8. `tsc --noEmit` passes. `npm test` passes. `next build` passes.
9. Stylelint passes.

---

## Scope

**Included:**
- `src/lib/legal-i18n/index.ts` — language registry and types
- `src/lib/legal-i18n/en.ts` — English source strings
- `src/lib/legal-i18n/ar.ts` — Arabic translations
- `src/lib/legal-i18n/ru.ts` — Russian translations
- `src/lib/legal-i18n/ja.ts` — Japanese translations
- `src/lib/legal-i18n/ko.ts` — Korean translations
- `src/lib/legal-i18n/nl.ts` — Dutch translations
- `src/lib/legal-i18n/fr.ts` — French translations
- `src/components/legal/LanguageSwitcher.tsx` — language selector component
- `src/components/legal/LanguageSwitcher.module.scss`
- `src/components/legal/DownloadPdfButton.tsx` — print trigger
- `src/components/legal/DownloadPdfButton.module.scss`
- Updated `app/terms/page.tsx` — use translations, add switcher + PDF button
- Updated `app/privacy/page.tsx` — use translations, add switcher + PDF button
- Print CSS added to `app/terms/page.module.scss` and `app/privacy/page.module.scss`

**Explicit exclusions:**
- Do NOT add i18n to login, register, dashboard, or admin pages
- Do NOT use Next.js i18n routing (`/ar/terms` paths) — use query param only
- Do NOT add `next-intl`, `react-i18next`, or any i18n library — custom lightweight solution only
- Do NOT add `html2pdf`, `jspdf`, `puppeteer`, or any PDF library — `window.print()` only
- Do NOT translate form validation messages or dashboard content
- Do NOT modify API routes
- Do NOT modify tests unless a test breaks

---

## Language Registry

```typescript
// src/lib/legal-i18n/index.ts

export const LANGUAGES = {
  en: { name: 'English',  dir: 'ltr', flag: '🇬🇧' },
  ar: { name: 'العربية',  dir: 'rtl', flag: '🇦🇪' },
  ru: { name: 'Русский',  dir: 'ltr', flag: '🇷🇺' },
  ja: { name: '日本語',    dir: 'ltr', flag: '🇯🇵' },
  ko: { name: '한국어',    dir: 'ltr', flag: '🇰🇷' },
  nl: { name: 'Nederlands', dir: 'ltr', flag: '🇳🇱' },
  fr: { name: 'Français', dir: 'ltr', flag: '🇫🇷' },
} as const;

export type LangCode = keyof typeof LANGUAGES;
export const DEFAULT_LANG: LangCode = 'en';

export interface LegalTranslation {
  // UI labels
  ui: {
    downloadPdf:        string;
    autoTranslationWarning: string;
    backToRegister:     string;
    effectiveDate:      string;
    version:            string;
    contact:            string;
    readTerms:          string;
    readPrivacy:        string;
    supervisoryAuthority: string;
  };
  // Section headings (body text remains in English for all non-English languages)
  terms: {
    badge:       string;
    title:       string;
    description: string;
    sections:    Array<{ title: string }>;
  };
  privacy: {
    badge:       string;
    title:       string;
    description: string;
    sections:    Array<{ title: string }>;
  };
}
```

---

## Translation Content — Terms sections (16 titles)

Codex must translate the following section titles into each language.
The body text under each section remains in English for all non-English languages.

**English section titles (source):**
```
1.  About the service
2.  Eligibility
3.  Account registration and security
4.  Licence to use the service
5.  Acceptable use — what you may not do
6.  Your data and content
7.  Feedback
8.  Free trial and entitlement
9.  Intellectual property
10. Availability, modifications, and termination
11. Disclaimer of warranties
12. Limitation of liability
13. Indemnification
14. Third-party services and links
15. Dispute resolution and governing law
16. General provisions
```

---

## Translation Content — Privacy sections (13 titles)

```
1.  Who we are and how to contact us
2.  Data we collect and why
3.  Automated decision-making and profiling
4.  How we share your data
5.  International data transfers
6.  Data retention
7.  Cookies and session data
8.  Security measures
9.  Children's privacy
10. Your rights
11. Your Jira data — specific commitments
12. Changes to this policy
13. Do Not Track
```

---

## Translation Content — UI Labels

Each language file must translate these UI strings:

```typescript
// Example for Arabic (ar.ts)
export const ar: LegalTranslation = {
  ui: {
    downloadPdf:            'تنزيل PDF',
    autoTranslationWarning: 'هذه ترجمة آلية. النسخة الإنجليزية هي الملزمة قانونياً.',
    backToRegister:         '← العودة إلى التسجيل',
    effectiveDate:          'تاريخ السريان',
    version:                'الإصدار',
    contact:                'التواصل',
    readTerms:              'اقرأ شروط الاستخدام ←',
    readPrivacy:            'اقرأ سياسة الخصوصية ←',
    supervisoryAuthority:   'السلطة الرقابية (المملكة المتحدة)',
  },
  terms: {
    badge:       'شروط الاستخدام',
    title:       'شروط الاستخدام',
    description: 'يرجى قراءة هذه الشروط بعناية قبل استخدام Delivery Clarity.',
    sections: [
      { title: 'نبذة عن الخدمة' },
      { title: 'الأهلية' },
      { title: 'تسجيل الحساب والأمان' },
      { title: 'ترخيص استخدام الخدمة' },
      { title: 'الاستخدام المقبول — ما لا يُسمح به' },
      { title: 'بياناتك ومحتواك' },
      { title: 'الملاحظات' },
      { title: 'الإصدار التجريبي المجاني والاستحقاق' },
      { title: 'الملكية الفكرية' },
      { title: 'التوفر والتعديلات والإنهاء' },
      { title: 'إخلاء مسؤولية الضمانات' },
      { title: 'تحديد المسؤولية' },
      { title: 'التعويض' },
      { title: 'الخدمات والروابط التابعة لأطراف ثالثة' },
      { title: 'حل النزاعات والقانون الحاكم' },
      { title: 'أحكام عامة' },
    ],
  },
  privacy: {
    badge:       'سياسة الخصوصية',
    title:       'سياسة الخصوصية',
    description: 'كيف نجمع بياناتك الشخصية ونستخدمها ونحميها.',
    sections: [
      { title: 'من نحن وكيفية التواصل معنا' },
      { title: 'البيانات التي نجمعها ولماذا' },
      { title: 'اتخاذ القرارات الآلية والتنميط' },
      { title: 'كيف نشارك بياناتك' },
      { title: 'نقل البيانات الدولي' },
      { title: 'الاحتفاظ بالبيانات' },
      { title: 'ملفات تعريف الارتباط وبيانات الجلسة' },
      { title: 'تدابير الأمان' },
      { title: 'خصوصية الأطفال' },
      { title: 'حقوقك' },
      { title: 'بيانات Jira الخاصة بك — التزامات محددة' },
      { title: 'التغييرات في هذه السياسة' },
      { title: 'عدم التتبع' },
    ],
  },
};
```

Codex must write equivalent translation files for: `ru.ts`, `ja.ts`, `ko.ts`, `nl.ts`, `fr.ts`.
Use Codex's knowledge of these languages. Mark each file with a comment:
`// AUTOMATED TRANSLATION — professional review recommended before legal reliance`

---

## LanguageSwitcher Component

```tsx
// src/components/legal/LanguageSwitcher.tsx
'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { LANGUAGES, type LangCode } from '@/lib/legal-i18n';
import styles from './LanguageSwitcher.module.scss';

interface Props {
  current: LangCode;
}

export function LanguageSwitcher({ current }: Props) {
  // On select: push ?lang=XX to URL
  // Display: flag emoji + language name
  // Dropdown or button group — designer choice, but must be keyboard accessible
}
```

SCSS requirements:
- Position: top-right of the page content area (sticky or fixed)
- Mobile: collapses to a compact selector
- Accessible: keyboard navigable, has aria-label="Select language"
- Print: `@media print { display: none }`

---

## DownloadPdfButton Component

```tsx
// src/components/legal/DownloadPdfButton.tsx
'use client';

export function DownloadPdfButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={styles.btn}
      aria-label={label}
    >
      {/* Download icon + label text */}
    </button>
  );
}
```

---

## Page Integration Pattern

Both terms and privacy pages become client components to read `?lang` query param:

```tsx
// app/terms/page.tsx — structure
'use client';
import { useSearchParams } from 'next/navigation';
import { LANGUAGES, DEFAULT_LANG, type LangCode } from '@/lib/legal-i18n';
import { translations } from '@/lib/legal-i18n'; // all languages
import { LanguageSwitcher } from '@/components/legal/LanguageSwitcher';
import { DownloadPdfButton } from '@/components/legal/DownloadPdfButton';

export default function TermsPage() {
  const params = useSearchParams();
  const langParam = params.get('lang') ?? DEFAULT_LANG;
  const lang: LangCode = langParam in LANGUAGES ? langParam as LangCode : DEFAULT_LANG;
  const t = translations[lang];
  const dir = LANGUAGES[lang].dir;
  const isTranslated = lang !== 'en';

  return (
    <div className={styles.page} dir={dir}>
      <AnimatedDataBackground className={`${styles.bg} ${styles.bgDim}`} />
      <div className={styles.inner}>
        <div className={styles.pageActions}>
          <LanguageSwitcher current={lang} />
          <DownloadPdfButton label={t.ui.downloadPdf} />
        </div>

        {isTranslated && (
          <div className={styles.translationBanner} role="note">
            {t.ui.autoTranslationWarning}
          </div>
        )}

        {/* Render sections with t.terms.sections[i].title for heading,
            English body text below each heading */}
      </div>
    </div>
  );
}
```

**Important:** Since `useSearchParams()` requires 'use client', the pages lose SSR metadata.
To preserve SEO metadata while using client hooks, extract metadata to a separate export:

```typescript
// Keep this at top of file, outside the client component
// Next.js 14 supports metadata in client component pages via a workaround:
// Use a server parent layout or generate metadata statically.
// For this implementation, use static metadata only (the page is legal content,
// language switching is UX, not SEO-critical).
```

---

## Print / PDF CSS

Add to both `page.module.scss` files:

```scss
@media print {
  // Hide decorative and navigation elements
  .bg,
  .bgDim,
  .pageActions,
  .translationBanner,
  .back {
    display: none !important;
  }

  // Reset glass morphism for print
  .inner {
    background:      white;
    backdrop-filter: none;
    padding:         0;
    max-inline-size: 100%;
  }

  .page {
    background: white;
  }

  // Ensure text is black on white for print
  .sectionTitle {
    color:     black;
    font-size: 14pt;
  }

  .body {
    color:     #222;
    font-size: 11pt;
  }

  .title {
    color:     black;
    font-size: 22pt;
  }

  .meta {
    color:     #444;
    font-size: 10pt;
  }

  .divider {
    border-block-end: 1px solid #ccc;
    background:       none;
  }

  .contactBox {
    border:     1px solid #ccc;
    background: #f9f9f9;
    color:      #222;
  }

  .badge {
    background:     #eee;
    color:          black;
    border-radius:  4px;
  }

  // Force page breaks before major sections
  .section:nth-child(5n) {
    break-before: page;
  }
}
```

---

## RTL Support for Arabic

When `lang === 'ar'`:
1. The root container gets `dir="rtl"`
2. The language switcher and PDF button are mirrored (CSS logical properties handle this automatically)
3. The back link arrow flips: use `←` which in RTL renders correctly as right-pointing
4. Ensure all margin/padding uses logical properties (`margin-inline-start`, `padding-inline-end`)
   — the existing SCSS already uses logical properties per CLAUDE.md

---

## Translation files structure

```
src/lib/legal-i18n/
  index.ts       ← registry, types, default export `translations` object
  en.ts          ← English (already exists as page content — extract to here)
  ar.ts          ← Arabic
  ru.ts          ← Russian
  ja.ts          ← Japanese
  ko.ts          ← Korean
  nl.ts          ← Dutch
  fr.ts          ← French
```

The `index.ts` `translations` export:

```typescript
import { en } from './en';
import { ar } from './ar';
import { ru } from './ru';
import { ja } from './ja';
import { ko } from './ko';
import { nl } from './nl';
import { fr } from './fr';

export const translations: Record<LangCode, LegalTranslation> = {
  en, ar, ru, ja, ko, nl, fr,
};
```

---

## SCSS class for translation banner

```scss
.translationBanner {
  background:       rgba(232, 93, 18, 0.1);
  border:           1px solid rgba(232, 93, 18, 0.3);
  border-radius:    8px;
  padding:          10px 14px;
  font-size:        12px;
  color:            var(--dc-acc2, #FF8A4C);
  margin-block-end: 24px;
  line-height:      1.5;

  @media print { display: none; }
}

.pageActions {
  display:          flex;
  align-items:      center;
  justify-content:  space-between;
  flex-wrap:        wrap;
  gap:              12px;
  margin-block-end: 24px;

  @media print { display: none; }
}
```

---

## Required commands after implementation

```bash
npx tsc --noEmit
npm test -- --runInBand
npx next build
npx stylelint "{app,src}/**/*.{css,scss}" --max-warnings=0
```

---

## Completion evidence required

1. Screenshot or description of the language switcher showing 7 languages
2. Confirmation Arabic correctly renders RTL
3. Confirmation print preview shows clean black-on-white with no animation/switcher
4. All 7 translation files exist and export the correct type
5. All required commands passed (exact output)
6. No new npm packages added

---

## Stop conditions

Stop and return to Claude if:
- Any translation language requires a font that is not already loaded
- The `useSearchParams()` + `AnimatedDataBackground` combination causes hydration errors
- Any existing test breaks for a non-obvious reason
- The Arabic RTL layout breaks the existing card or form layout
