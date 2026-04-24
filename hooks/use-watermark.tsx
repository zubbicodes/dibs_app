import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@dibs_watermark';

type WatermarkValue = {
  watermarkEnabled: boolean;
  setWatermarkEnabled: (enabled: boolean) => Promise<void>;
};

const WatermarkContext = createContext<WatermarkValue | null>(null);

export function WatermarkProvider({ children }: { children: ReactNode }) {
  const [watermarkEnabled, setWatermarkState] = useState(true);

  useEffect(() => {
    const load = async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        setWatermarkState(stored === 'true');
      }
    };
    load();
  }, []);

  const setWatermarkEnabled = async (enabled: boolean) => {
    setWatermarkState(enabled);
    await AsyncStorage.setItem(STORAGE_KEY, String(enabled));
  };

  const value = useMemo(
    () => ({
      watermarkEnabled,
      setWatermarkEnabled,
    }),
    [watermarkEnabled]
  );

  return (
    <WatermarkContext.Provider value={value}>
      {children}
    </WatermarkContext.Provider>
  );
}

export function useWatermark() {
  const ctx = useContext(WatermarkContext);
  if (!ctx) {
    return {
      watermarkEnabled: true,
      setWatermarkEnabled: async () => {},
    } satisfies WatermarkValue;
  }
  return ctx;
}