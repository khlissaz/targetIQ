'use client';

import React, { createContext, useContext, useEffect, useLayoutEffect, useState } from 'react';
import { Language } from '@/lib/i18n';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getInitialLanguage(): Language {
  // Always default to 'en' for the initial render so
  // server-rendered HTML matches the first client render.
  return 'en';
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => getInitialLanguage());

  // After mount, hydrate language from localStorage (if present).
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const saved = localStorage.getItem('language');
      if (saved === 'ar' || saved === 'en') {
        setLanguageState((prev) => (prev !== saved ? saved : prev));
      }
    } catch {
      // ignore
    }
  }, []);

  useLayoutEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
