/**
 * Phone detection helpers for the SSD MobileNet v1 COCO TFLite model.
 *
 * The bundled model expects a 300x300 RGB uint8 image. Camera frames are resized
 * by vision-camera-resize-plugin before being passed to these helpers.
 */
import { CONFIDENCE_THRESHOLD } from '@/constants/detection';
import type { TensorflowModel } from 'react-native-fast-tflite';

export const MODEL_INPUT_SIZE = 300;

// Different SSD MobileNet COCO exports report either compact/zero-based
// indices or label-map indices. Keep the phone ids broad so valid detections
// are not dropped because of model metadata differences.
const CELL_PHONE_CLASS_IDS = [67, 76, 77];

export interface PhoneDetectionResult {
  detected: boolean;
  confidence: number;
  classes: string[];
  totalDetections: number;
}

export function emptyPhoneDetectionResult(): PhoneDetectionResult {
  'worklet';
  return { detected: false, confidence: 0, classes: [], totalDetections: 0 };
}

export function parsePhoneDetectionOutputs(outputs: ArrayBuffer[]): PhoneDetectionResult {
  'worklet';

  if (outputs.length < 3) {
    return emptyPhoneDetectionResult();
  }

  let classes = new Float32Array(outputs[1]);
  let scores = new Float32Array(outputs[2]);

  // Some object-detection exports order these two tensors as scores/classes.
  // Classes should contain integer-ish ids above 1, while scores are 0..1.
  const firstClass = classes[0] ?? 0;
  const firstScore = scores[0] ?? 0;
  if (firstClass <= 1 && firstScore > 1) {
    const swapped = classes;
    classes = scores;
    scores = swapped;
  }

  const numDetections = outputs[3] ? new Float32Array(outputs[3])[0] : scores.length;
  const limit = Math.min(scores.length, Math.max(0, Math.floor(numDetections)));

  let maxConfidence = 0;
  let totalDetections = 0;

  for (let i = 0; i < limit; i++) {
    const score = scores[i] ?? 0;
    if (score < CONFIDENCE_THRESHOLD) continue;

    totalDetections++;
    const classId = Math.round(classes[i] ?? -1);
    if (CELL_PHONE_CLASS_IDS.includes(classId)) {
      maxConfidence = Math.max(maxConfidence, score);
    }
  }

  const detected = maxConfidence >= CONFIDENCE_THRESHOLD;
  return {
    detected,
    confidence: maxConfidence,
    classes: detected ? ['cell_phone'] : [],
    totalDetections,
  };
}

export function runPhoneDetectionModel(
  model: TensorflowModel,
  inputBuffer: ArrayBuffer
): PhoneDetectionResult {
  try {
    const outputs = model.runSync([inputBuffer]);
    return parsePhoneDetectionOutputs(outputs);
  } catch (err) {
    console.error('[PhoneDetector] Model inference failed:', err);
    return emptyPhoneDetectionResult();
  }
}

export function detectExternalDevicesFromFrame(
  model: TensorflowModel,
  frameData: Uint8Array,
  _frameWidth: number,
  _frameHeight: number
): PhoneDetectionResult {
  const inputBuffer = frameData.buffer.slice(
    frameData.byteOffset,
    frameData.byteOffset + frameData.byteLength
  ) as ArrayBuffer;
  return runPhoneDetectionModel(model, inputBuffer);
}
