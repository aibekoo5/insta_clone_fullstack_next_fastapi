
"use client";

import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';

// Import translations directly
import enTranslations from '@/locales/en.json';
import ruTranslations from '@/locales/ru.json';
import kkTranslations from '@/locales/kk.json';

export type SupportedLanguage = 'en' | 'ru' | 'kk';
type Translations = Record<string, string>;
type AllTranslations = Record<SupportedLanguage, Translations>;

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
  defaultLanguage?: SupportedLanguage;
  storageKey?: string;
}

const translations: AllTranslations = {
  en: enTranslations,
  ru: ruTranslations,
  kk: kkTranslations,
};

export function LanguageProvider({
  children,
  defaultLanguage = 'en',
  storageKey = 'app-language',
}: LanguageProviderProps) {
  // Initialize with defaultLanguage for consistent SSR and initial client render
  const [language, setLanguageState] = useState<SupportedLanguage>(defaultLanguage);

  // Effect to load language from localStorage on client-side after initial mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedLanguage = localStorage.getItem(storageKey) as SupportedLanguage | null;
      if (storedLanguage && storedLanguage !== language) {
        setLanguageState(storedLanguage);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]); // Run only once on mount to check localStorage

  // Effect to save language to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, language);
      // You might want to set lang attribute on html tag here too
      // document.documentElement.lang = language;
    }
  }, [language, storageKey]);

  const setLanguage = useCallback((newLanguage: SupportedLanguage) => {
    setLanguageState(newLanguage);
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const langTranslations = translations[language] || translations.en;
      let translation = langTranslations[key] || key;

      if (params) {
        Object.keys(params).forEach((paramKey) => {
          translation = translation.replace(
            new RegExp(`{{${paramKey}}}`, 'g'),
            String(params[paramKey])
          );
        });
      }
      return translation;
    },
    [language]
  );

  const value = {
    language,
    setLanguage,
    t,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
