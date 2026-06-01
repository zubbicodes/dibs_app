import * as FileSystem from 'expo-file-system/legacy';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { loadTensorflowModel, type TensorflowModel } from '@/lib/native-tflite';

const MODEL_URL =
  'https://koavgdbgmiornyxbqjva.supabase.co/storage/v1/object/public/facemodel/mobilefacenet.tflite';
const MODEL_FILENAME = 'mobilefacenet.tflite';
// documentDirectory persists across app launches; cacheDirectory can be purged by the OS.
const MODEL_PATH = `${FileSystem.documentDirectory}${MODEL_FILENAME}`;
const EXPECTED_MIN_BYTES = 500_000; // sanity check — real model is ~5MB

type FaceModelState = 'loading' | 'downloading' | 'loaded' | 'error';

type FaceModelContextValue = {
  model: TensorflowModel | undefined;
  state: FaceModelState;
  progress?: number;
  error?: string;
  downloadModel: () => Promise<void>;
};

const FaceModelContext = createContext<FaceModelContextValue>({
  model: undefined,
  state: 'loading',
  downloadModel: async () => {},
});

export function FaceModelProvider({ children }: { children: ReactNode }) {
  const [model, setModel] = useState<TensorflowModel | undefined>(undefined);
  const [state, setState] = useState<FaceModelState>('loading');
  const [progress, setProgress] = useState<number | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const inFlightRef = useRef(false);

  const loadFromDisk = async (): Promise<TensorflowModel> => {
    // fast-tflite needs a file:// URI
    return loadTensorflowModel({ url: MODEL_PATH }, []);
  };

  const downloadAndLoadModel = async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      setError(undefined);

      const info = await FileSystem.getInfoAsync(MODEL_PATH);
      const cachedSize = info.exists ? (info as { size?: number }).size ?? 0 : 0;
      if (info.exists && cachedSize >= EXPECTED_MIN_BYTES) {
        setState('loading');
        const loaded = await loadFromDisk();
        setModel(loaded);
        setState('loaded');
        return;
      }

      // Stale or missing — remove and re-download.
      if (info.exists) {
        try {
          await FileSystem.deleteAsync(MODEL_PATH, { idempotent: true });
        } catch {}
      }

      setState('downloading');
      setProgress(0);

      const resumable = FileSystem.createDownloadResumable(
        MODEL_URL,
        MODEL_PATH,
        {},
        (p) => {
          if (!p.totalBytesExpectedToWrite) return;
          setProgress(p.totalBytesWritten / p.totalBytesExpectedToWrite);
        }
      );

      const result = await resumable.downloadAsync();
      if (!result?.uri) throw new Error('Download failed');

      setState('loading');
      const loaded = await loadFromDisk();
      setModel(loaded);
      setState('loaded');
      setProgress(1);
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      setError(msg);
      setState('error');
    } finally {
      inFlightRef.current = false;
    }
  };

  useEffect(() => {
    void downloadAndLoadModel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FaceModelContext.Provider
      value={{ model, state, progress, error, downloadModel: downloadAndLoadModel }}>
      {children}
    </FaceModelContext.Provider>
  );
}

export function useFaceModel(): FaceModelContextValue {
  return useContext(FaceModelContext);
}
