import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ScreenCapture from 'expo-screen-capture';
import { Platform } from 'react-native';

const STORAGE_KEY = '@dibs_screenshot_protection';

type ScreenshotProtectionValue = {
  screenshotProtectionEnabled: boolean;
  setScreenshotProtectionEnabled: (enabled: boolean) => Promise<void>;
};

const ScreenshotProtectionContext = createContext<ScreenshotProtectionValue | null>(null);

export function ScreenshotProtectionProvider({ children }: { children: ReactNode }) {
  const [screenshotProtectionEnabled, setScreenshotProtectionState] = useState(true);

  useEffect(() => {
    const load = async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setScreenshotProtectionState(stored === 'true');
      }
    };
    load();
  }, []);

  useEffect(() => {
    const updateScreenCapture = async () => {
      if (Platform.OS === 'web') return;
      if (screenshotProtectionEnabled) {
        await ScreenCapture.preventScreenCaptureAsync();
      } else {
        await ScreenCapture.allowScreenCaptureAsync();
      }
    };
    updateScreenCapture();
  }, [screenshotProtectionEnabled]);

  const setScreenshotProtectionEnabled = async (enabled: boolean) => {
    setScreenshotProtectionState(enabled);
    await AsyncStorage.setItem(STORAGE_KEY, String(enabled));
  };

  const value = useMemo(
    () => ({
      screenshotProtectionEnabled,
      setScreenshotProtectionEnabled,
    }),
    [screenshotProtectionEnabled]
  );

  return (
    <ScreenshotProtectionContext.Provider value={value}>
      {children}
    </ScreenshotProtectionContext.Provider>
  );
}

export function useScreenshotProtection() {
  const ctx = useContext(ScreenshotProtectionContext);
  if (!ctx) {
    return {
      screenshotProtectionEnabled: true,
      setScreenshotProtectionEnabled: async () => {},
    } satisfies ScreenshotProtectionValue;
  }
  return ctx;
}
