
import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, SupportedLocale } from '../i18n/translations';

const LocaleContext = createContext<{
  locale: SupportedLocale;
  setLocale: (l: SupportedLocale) => void;
  t: (k: keyof typeof translations['en']) => string;
  isRTL: boolean;
} | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>('ar');

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('locale');
        if (saved === 'ar' || saved === 'en') setLocaleState(saved);
      } catch (e) {
        console.log('Locale load error', e);
      }
    })();
  }, []);

  const setLocale = async (l: SupportedLocale) => {
    setLocaleState(l);
    try { await AsyncStorage.setItem('locale', l); } catch (e) { console.log('Locale save error', e); }
  };

  const t = (k: keyof typeof translations['en']) => translations[locale][k] || k;

  const isRTL = locale === 'ar';

  return <LocaleContext.Provider value={{ locale, setLocale, t, isRTL }}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale outside provider');
  return ctx;
}
