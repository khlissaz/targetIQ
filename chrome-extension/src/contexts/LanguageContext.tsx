import React, { createContext, useContext, useState, ReactNode } from 'react';
import en from '../lib/locales/en.json';
import ar from '../lib/locales/ar.json';

const locales: Record<string, Record<string, string>> = { en, ar };

interface LanguageContextProps {
  lang: string;
  setLang: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  // Detect default language from page
  let defaultLang = 'en';
  if (typeof document !== 'undefined') {
    const html = document.documentElement;
    const dir = html.getAttribute('dir');
    const langAttr = html.getAttribute('lang');
    if ((dir && dir.toLowerCase() === 'ar') || (langAttr && langAttr.toLowerCase().startsWith('ar'))) {
      defaultLang = 'ar';
    }
  }
  const [lang, setLang] = useState(defaultLang);
  const t = (key: string) => locales[lang]?.[key] || key;
  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
}
