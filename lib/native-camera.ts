import { Platform } from 'react-native';

import type {
  Camera as CameraType,
  CameraRuntimeError,
  runAtTargetFps as RunAtTargetFpsType,
  useCameraDevice as UseCameraDeviceType,
  useCameraPermission as UseCameraPermissionType,
  useFrameProcessor as UseFrameProcessorType,
} from 'react-native-vision-camera';
import type { useFaceDetector as UseFaceDetectorType, Face as FaceType } from 'react-native-vision-camera-face-detector';
import type { Worklets as WorkletsType } from 'react-native-worklets-core';
import type { useResizePlugin as UseResizePluginType } from 'vision-camera-resize-plugin';

let vc: any;
let vcfd: any;
let workletsMod: any;
let resizeMod: any;

if (Platform.OS !== 'web') {
  try { vc = require('react-native-vision-camera'); } catch {}
  try { vcfd = require('react-native-vision-camera-face-detector'); } catch {}
  try { workletsMod = require('react-native-worklets-core'); } catch {}
  try { resizeMod = require('vision-camera-resize-plugin'); } catch {}
}

// Camera component
export const Camera: typeof CameraType = vc?.Camera ?? (function NoopCamera() { return null; } as any);
export type Camera = CameraType;

// Hooks
export const useCameraPermission: typeof UseCameraPermissionType = vc?.useCameraPermission ?? (() => ({ hasPermission: false, requestPermission: async () => {} } as any));
export const useCameraDevice: typeof UseCameraDeviceType = vc?.useCameraDevice ?? (() => undefined);
export const useFrameProcessor: typeof UseFrameProcessorType = vc?.useFrameProcessor ?? ((frameProcessor, dependencies) => frameProcessor);
export const runAtTargetFps: typeof RunAtTargetFpsType = vc?.runAtTargetFps ?? ((fps, func) => func());

// Types
export type { CameraRuntimeError } from 'react-native-vision-camera';

// Face detector
export const useFaceDetector: typeof UseFaceDetectorType = vcfd?.useFaceDetector ?? ((options: any) => ({ detectFaces: () => [] }));
export type { Face } from 'react-native-vision-camera-face-detector';

// Worklets
export const Worklets: typeof WorkletsType = workletsMod?.Worklets ?? { createRunOnJS: (fn: any) => fn } as any;

// Resize plugin
export const useResizePlugin: typeof UseResizePluginType = resizeMod?.useResizePlugin ?? (() => ({ resize: () => ({ buffer: new ArrayBuffer(0), byteOffset: 0, byteLength: 0 }) as any }));
