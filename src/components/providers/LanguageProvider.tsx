'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { LanguageContext, zhStrings, enStrings, type Language, type Translations } from '@/hooks/useLanguage';

function getBrowserLanguage(): Language {
  if (typeof window !== 'undefined') {
    const browserLang = navigator.language || (navigator as any).userLanguage;
    if (browserLang && browserLang.startsWith('zh')) {
      return 'zh';
    }
  }
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('web-img-language');
    if (saved === 'en' || saved === 'zh') {
      setLanguage(saved as Language);
    } else {
      setLanguage(getBrowserLanguage());
    }
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('web-img-language', language);
    }
  }, [language, isMounted]);

  const toggleLanguage = useCallback(() => {
    setLanguage(prev => (prev === 'zh' ? 'en' : 'zh'));
  }, []);

  const t = useCallback((key: keyof Translations): string => {
    const strings: Record<string, string> = language === 'zh' ? zhStrings : enStrings;
    return strings[key] ?? String(key);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, t, toggleLanguage, isMounted }}>
      {children}
    </LanguageContext.Provider>
  );
}
