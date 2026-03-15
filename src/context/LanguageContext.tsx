'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type Language = 'ko' | 'en' | 'ja';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  mounted: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'ko',
  setLanguage: () => {},
  mounted: false,
});

export function useLanguage() {
  return useContext(LanguageContext);
}

function detectLanguage(): Language {
  if (typeof navigator === 'undefined') return 'ko';

  const lang = navigator.language || '';
  const primary = lang.split('-')[0].toLowerCase();

  if (primary === 'ja') return 'ja';
  if (primary === 'en') return 'en';
  return 'ko'; // default to Korean
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ko');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('blog-language') as Language | null;
    if (saved && ['ko', 'en', 'ja'].includes(saved)) {
      setLanguageState(saved);
    } else {
      setLanguageState(detectLanguage());
    }
    setMounted(true);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('blog-language', lang);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, mounted }}>
      {children}
    </LanguageContext.Provider>
  );
}
