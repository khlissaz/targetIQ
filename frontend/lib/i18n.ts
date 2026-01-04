export type Language = 'en' | 'ar';

import en from './locales/en.json';
import ar from './locales/ar.json';

const translations: Record<Language, Record<string, string>> = {
  en,
  ar,
};

export const useTranslation = (lang: Language) => {
  const t = (key: keyof typeof en): string => {
    return translations[lang][key] || translations.en[key] || key;
  };
  return { t, dir: lang === 'ar' ? 'rtl' : 'ltr' };
};
