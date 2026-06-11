/**
 * Core face-recognition pipeline for DIBS.
 *
 * Model: MobileFaceNet (112x112 RGB input, 192-d L2-normalized embedding output).
 * Place the ".tflite" file at "assets/models/mobilefacenet.tflite" — the
 * "react-native-fast-tflite" config plugin bundles it automatically.
 *
 * The pipeline:
 *   photo URI  →  crop to face (expo-image-manipulator, 112x112)
 *              →  JPEG decode (jpeg-js)
 *              →  normalize to Float32 in [-1, 1]
 *              →  TFLite inference  →  192-d embedding
 *              →  L2-normalize
 *
 * Comparison uses cosine similarity. We treat MATCH_THRESHOLD = 0.70 as a match;
 * tune this after real-world testing with your user set.
 */
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import jpeg from 'jpeg-js';
import { Platform } from 'react-native';

import { supabase } from './supabase';

export const EMBEDDING_SIZE = 128; // face-api.js uses 128-dimensional embeddings
export const MODEL_INPUT_SIZE = 112;
export const MATCH_THRESHOLD = 0.7;

export type Embedding = number[];

export interface FaceBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CropContext {
  photoWidth: number;
  photoHeight: number;
}

/**
 * Crop a face region (with 20% padding) and resize to 112×112 JPEG, base64-encoded.
 */
export async function cropFaceTo112(
  photoUri: string,
  bounds: FaceBounds,
  ctx: CropContext
): Promise<string> {
  if (Platform.OS === 'web') {
    // Web implementation using canvas
    return cropFaceTo112Web(photoUri, bounds, ctx);
  }
  const padX = bounds.width * 0.2;
  const padY = bounds.height * 0.2;
  const cropX = Math.max(0, Math.floor(bounds.x - padX));
  const cropY = Math.max(0, Math.floor(bounds.y - padY));
  const cropW = Math.min(
    ctx.photoWidth - cropX,
    Math.ceil(bounds.width + 2 * padX)
  );
  const cropH = Math.min(
    ctx.photoHeight - cropY,
    Math.ceil(bounds.height + 2 * padY)
  );

  const result = await manipulateAsync(
    photoUri,
    [
      { crop: { originX: cropX, originY: cropY, width: cropW, height: cropH } },
      { resize: { width: MODEL_INPUT_SIZE, height: MODEL_INPUT_SIZE } },
    ],
    { format: SaveFormat.JPEG, compress: 1.0, base64: true }
  );
  if (!result.base64) {
    throw new Error('Failed to encode cropped face as base64 JPEG');
  }
  return result.base64;
}

/** Web version of cropFaceTo112 using canvas */
async function cropFaceTo112Web(
  photoUri: string,
  bounds: FaceBounds,
  ctx: CropContext
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const canvasCtx = canvas.getContext('2d');
      if (!canvasCtx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      const padX = bounds.width * 0.2;
      const padY = bounds.height * 0.2;
      const cropX = Math.max(0, Math.floor(bounds.x - padX));
      const cropY = Math.max(0, Math.floor(bounds.y - padY));
      const cropW = Math.min(
        ctx.photoWidth - cropX,
        Math.ceil(bounds.width + 2 * padX)
      );
      const cropH = Math.min(
        ctx.photoHeight - cropY,
        Math.ceil(bounds.height + 2 * padY)
      );

      canvas.width = MODEL_INPUT_SIZE;
      canvas.height = MODEL_INPUT_SIZE;

      // Draw cropped and resized image
      canvasCtx.drawImage(
        img,
        cropX, cropY, cropW, cropH,
        0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE
      );

      resolve(canvas.toDataURL('image/jpeg', 1.0).split(',')[1]);
    };
    img.onerror = reject;
    img.src = photoUri;
  });
}

/**
 * Resize the whole photo to 112×112 (used when the caller has already
 * framed the face within a guide). Base64 JPEG out.
 */
export async function resizePhotoTo112(photoUri: string): Promise<string> {
  if (Platform.OS === 'web') {
    return resizePhotoTo112Web(photoUri);
  }
  const result = await manipulateAsync(
    photoUri,
    [{ resize: { width: MODEL_INPUT_SIZE, height: MODEL_INPUT_SIZE } }],
    { format: SaveFormat.JPEG, compress: 1.0, base64: true }
  );
  if (!result.base64) {
    throw new Error('Failed to encode resized photo as base64 JPEG');
  }
  return result.base64;
}

async function resizePhotoTo112Web(photoUri: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const canvasCtx = canvas.getContext('2d');
      if (!canvasCtx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      canvas.width = MODEL_INPUT_SIZE;
      canvas.height = MODEL_INPUT_SIZE;
      canvasCtx.drawImage(img, 0, 0, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE);
      resolve(canvas.toDataURL('image/jpeg', 1.0).split(',')[1]);
    };
    img.onerror = reject;
    img.src = photoUri;
  });
}

/**
 * Decode a base64 JPEG into a Float32 tensor of shape [112 * 112 * 3],
 * normalized to [-1, 1] (MobileFaceNet convention).
 */
export function decodeJpegToTensor(base64: string): Float32Array {
  const binary = globalThis.atob
    ? globalThis.atob(base64)
    : decodeBase64Fallback(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  const { data, width, height } = jpeg.decode(bytes, { useTArray: true });
  if (width !== MODEL_INPUT_SIZE || height !== MODEL_INPUT_SIZE) {
    throw new Error(
      `Expected ${MODEL_INPUT_SIZE}x${MODEL_INPUT_SIZE}, got ${width}x${height}`
    );
  }

  // jpeg-js returns RGBA bytes (length = w*h*4). Convert to planar RGB Float32 [-1, 1].
  const tensor = new Float32Array(MODEL_INPUT_SIZE * MODEL_INPUT_SIZE * 3);
  let t = 0;
  for (let i = 0; i < data.length; i += 4) {
    tensor[t++] = (data[i] - 127.5) / 127.5;
    tensor[t++] = (data[i + 1] - 127.5) / 127.5;
    tensor[t++] = (data[i + 2] - 127.5) / 127.5;
  }
  return tensor;
}

function decodeBase64Fallback(b64: string): string {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = b64.replace(/=+$/, '');
  let out = '';
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < clean.length; i++) {
    const v = chars.indexOf(clean[i]);
    if (v < 0) continue;
    buffer = (buffer << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return out;
}

/** L2-normalize. Returns a new Float32Array. */
export function l2Normalize(v: Float32Array | number[]): Float32Array {
  let sum = 0;
  for (let i = 0; i < v.length; i++) sum += v[i] * v[i];
  const norm = Math.sqrt(sum) || 1;
  const out = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i] / norm;
  return out;
}

/** Cosine similarity. Caller is expected to pass L2-normalized vectors. */
export function cosineSimilarity(
  a: number[] | Float32Array,
  b: number[] | Float32Array
): number {
  if (a.length !== b.length) return 0;
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}

/** Average N embeddings (for multi-capture enrollment) and L2-normalize the result. */
export function averageEmbeddings(embeddings: number[][]): number[] {
  if (embeddings.length === 0) {
    throw new Error('averageEmbeddings: empty input');
  }
  const size = embeddings[0].length;
  const sum = new Float32Array(size);
  for (const e of embeddings) {
    for (let i = 0; i < size; i++) sum[i] += e[i];
  }
  for (let i = 0; i < size; i++) sum[i] /= embeddings.length;
  return Array.from(l2Normalize(sum));
}

/**
 * Run the TFLite model on a Float32 tensor and return an L2-normalized embedding.
 * Caller owns model loading (via `useTensorflowModel` hook from `react-native-fast-tflite`).
 */
export function runFaceModel(model: any, tensor: Float32Array): number[] {
  const outputs = model.runSync([tensor.buffer as ArrayBuffer]);
  const raw = new Float32Array(outputs[0]);
  return Array.from(l2Normalize(raw));
}

/**
 * One-shot: given a photo and the detected face bounds, produce an embedding.
 */
export async function embedFaceFromPhoto(
  model: any,
  photoUri: string,
  bounds: FaceBounds,
  ctx: CropContext
): Promise<number[]> {
  const croppedBase64 = await cropFaceTo112(photoUri, bounds, ctx);
  const tensor = decodeJpegToTensor(croppedBase64);
  return runFaceModel(model, tensor);
}

// ---------- Supabase persistence ----------

export async function saveEnrollment(
  userId: string,
  embedding: number[],
  deviceInfo?: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.from('face_enrollments').upsert(
    {
      user_id: userId,
      embedding,
      device_info: deviceInfo ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
  if (error) throw error;
}

export async function getEnrollment(userId: string): Promise<number[] | null> {
  const { data, error } = await supabase
    .from('face_enrollments')
    .select('embedding')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return data.embedding as number[];
}

export async function hasEnrollment(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('face_enrollments')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function deleteEnrollment(userId: string): Promise<void> {
  const { error } = await supabase
    .from('face_enrollments')
    .delete()
    .eq('user_id', userId);
  if (error) throw error;
}

// ---------- Liveness helpers ----------

export type LivenessState =
  | 'idle'
  | 'look-straight'
  | 'eyes-closed'
  | 'eyes-open-again'
  | 'passed'
  | 'failed';

export interface LivenessSignals {
  leftEyeOpenProbability?: number;
  rightEyeOpenProbability?: number;
}

/**
 * Stateless transition for the blink-based liveness check.
 * The UI holds the current state and calls this per frame with fresh signals.
 *
 * Flow: look-straight (both eyes open) → eyes-closed (both closed) → eyes-open-again → passed
 */
export function nextLivenessState(
  state: LivenessState,
  signals: LivenessSignals
): LivenessState {
  const left = signals.leftEyeOpenProbability ?? 0.5;
  const right = signals.rightEyeOpenProbability ?? 0.5;
  const bothOpen = left > 0.8 && right > 0.8;
  const bothClosed = left < 0.3 && right < 0.3;

  switch (state) {
    case 'idle':
    case 'look-straight':
      return bothOpen ? 'eyes-closed' : 'look-straight';
    case 'eyes-closed':
      return bothClosed ? 'eyes-open-again' : 'eyes-closed';
    case 'eyes-open-again':
      return bothOpen ? 'passed' : 'eyes-open-again';
    default:
      return state;
  }
}
