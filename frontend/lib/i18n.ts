export type Language = 'en' | 'ar';

import en from './locales/en.json';
import ar from './locales/ar.json';
import { safeLog } from '@/lib/safeLogging';

const translations: Record<Language, Record<string, string>> = {
  en,
  ar,
};

const missingKeyFallback: Record<string, string> = {
  'credits.title': 'Credits',
  'credits.monthly': 'Monthly',
  'credits.capture': 'Capture',
  'credits.enrich': 'Enrich',
  'credits.reset': 'Reset',
};

const warnedMissingKeys = new Set<string>();

function normalizeLanguage(lang: unknown): Language {
  return lang === 'ar' ? 'ar' : 'en';
}

export function getStoredLanguage(fallback: Language = 'en'): Language {
  try {
    if (typeof window === 'undefined') return fallback;
    const raw = localStorage.getItem('language');
    return normalizeLanguage(raw);
  } catch {
    return fallback;
  }
}

function isProdBuild(): boolean {
  try {
    return typeof process !== 'undefined' && process.env?.NODE_ENV === 'production';
  } catch {
    return false;
  }
}

function warnMissingOnce(key: string) {
  if (!isProdBuild()) return;
  if (warnedMissingKeys.has(key)) return;
  warnedMissingKeys.add(key);
  safeLog('warn', 'i18n.missing_key', { key });
}

function humanizeKey(key: string): string {
  const last = key.split('.').filter(Boolean).slice(-1)[0] || '';
  const spaced = last
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .trim();

  if (!spaced) return '';

  return spaced
    .split(/\s+/g)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

function translateKey(lang: Language, key: string): string {
  const value = translations[lang][key] ?? translations.en[key];
  if (typeof value === 'string') return value;

  const fallback = missingKeyFallback[key];
  if (!isProdBuild()) return fallback ?? humanizeKey(key);

  warnMissingOnce(key);
  return fallback ?? '';
}

// Non-hook translation helper for non-React code (services, Zustand store, etc.).
// Keeps the same fallback behavior as useTranslation().
export function translate(key: string, lang: Language = getStoredLanguage()): string {
  return translateKey(lang, key);
}

export const useTranslation = (lang: Language) => {
  const t = (key: string): string => {
    return translateKey(lang, key);
  };
  return { t, dir: lang === 'ar' ? 'rtl' : 'ltr' };
};
