import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

export type AppColorScheme = 'light' | 'dark';

type ThemeModeContextValue = {
  colorScheme: AppColorScheme;
  setColorScheme: (scheme: AppColorScheme) => void;
};

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

const STORAGE_KEY = 'dibs.colorScheme';

async function readStoredScheme(): Promise<AppColorScheme | null> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return null;
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return stored === 'dark' || stored === 'light' ? stored : null;
    }

    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    return stored === 'dark' || stored === 'light' ? stored : null;
  } catch {
    return null;
  }
}

async function writeStoredScheme(scheme: AppColorScheme): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(STORAGE_KEY, scheme);
      return;
    }

    await AsyncStorage.setItem(STORAGE_KEY, scheme);
  } catch {}
}

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [colorScheme, setColorSchemeState] = useState<AppColorScheme>('light');

  useEffect(() => {
    let isMounted = true;

    void (async () => {
      const stored = await readStoredScheme();
      if (!isMounted || !stored) return;
      setColorSchemeState(stored);
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const setColorScheme = useCallback((scheme: AppColorScheme) => {
    setColorSchemeState(scheme);
    void writeStoredScheme(scheme);
  }, []);

  const value = useMemo(() => ({ colorScheme, setColorScheme }), [colorScheme, setColorScheme]);

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export function useColorScheme(): AppColorScheme {
  const ctx = useContext(ThemeModeContext);
  if (ctx) return ctx.colorScheme;
  return 'light';
}

export function useSetColorScheme() {
  const ctx = useContext(ThemeModeContext);
  return ctx?.setColorScheme ?? (() => {});
}
