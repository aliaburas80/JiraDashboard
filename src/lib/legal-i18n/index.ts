// © 2026 Ali Abu Ras — aliaburas80@gmail.com. All rights reserved.
// EP-I18N-01: Legal page translation registry.

export const LANGUAGES = {
  en: { name: 'English',    dir: 'ltr' as const, flag: '🇬🇧' },
  ar: { name: 'العربية',    dir: 'rtl' as const, flag: '🇦🇪' },
  ru: { name: 'Русский',    dir: 'ltr' as const, flag: '🇷🇺' },
  ja: { name: '日本語',      dir: 'ltr' as const, flag: '🇯🇵' },
  ko: { name: '한국어',      dir: 'ltr' as const, flag: '🇰🇷' },
  nl: { name: 'Nederlands', dir: 'ltr' as const, flag: '🇳🇱' },
  fr: { name: 'Français',   dir: 'ltr' as const, flag: '🇫🇷' },
} as const;

export type LangCode = keyof typeof LANGUAGES;
export const DEFAULT_LANG: LangCode = 'en';

export interface LegalTranslation {
  ui: {
    downloadPdf:             string;
    autoTranslationWarning:  string;
    backToRegister:          string;
    effectiveDate:           string;
    version:                 string;
    contact:                 string;
    readTerms:               string;
    readPrivacy:             string;
    supervisoryAuthority:    string;
    selectLanguage:          string;
  };
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

// Import all language files
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
