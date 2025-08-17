
import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark';

const light = {
  primary: '#0B5',
  secondary: '#E53935',
  accent: '#1E88E5',
  background: '#FFFFFF',
  backgroundAlt: '#F5F7FA',
  text: '#1F2937',
  grey: '#9CA3AF',
  card: '#FFFFFF',
  border: '#E5E7EB',
};

const dark = {
  primary: '#34D399',
  secondary: '#EF4444',
  accent: '#60A5FA',
  background: '#0B1220',
  backgroundAlt: '#111827',
  text: '#E5E7EB',
  grey: '#9CA3AF',
  card: '#111827',
  border: '#1F2937',
};

const ThemeContext = createContext<{
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  toggleTheme: () => void;
} | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('light');

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('theme');
        if (saved === 'light' || saved === 'dark') {
          setThemeState(saved);
        } else {
          const sys = Appearance.getColorScheme();
          setThemeState(sys === 'dark' ? 'dark' : 'light');
        }
      } catch (e) {
        console.log('Theme load error', e);
      }
    })();
  }, []);

  const setTheme = async (t: ThemeMode) => {
    setThemeState(t);
    try { await AsyncStorage.setItem('theme', t); } catch (e) { console.log('Theme save error', e); }
  };

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  return <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme outside provider');
  return ctx;
}

export function useThemeColors() {
  const { theme } = useTheme();
  const colors = useMemo(() => (theme === 'light' ? light : dark), [theme]);
  return { colors };
}
