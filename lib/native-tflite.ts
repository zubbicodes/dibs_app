import { Platform } from 'react-native';
import type {
  loadTensorflowModel as LoadTensorflowModelType,
  useTensorflowModel as UseTensorflowModelType,
  TensorflowModel,
} from 'react-native-fast-tflite';

let tflite: any;

if (Platform.OS !== 'web') {
  try { tflite = require('react-native-fast-tflite'); } catch {}
}

export const loadTensorflowModel: typeof LoadTensorflowModelType = tflite?.loadTensorflowModel ?? (async () => { throw new Error('TensorFlow Lite is not available in Expo Go. Use a development build.'); });
export const useTensorflowModel: typeof UseTensorflowModelType = tflite?.useTensorflowModel ?? ((model: any, options?: any) => ({ state: 'error' as const, model: undefined, error: new Error('TensorFlow Lite is not available in Expo Go. Use a development build.') }));
export type { TensorflowModel } from 'react-native-fast-tflite';
