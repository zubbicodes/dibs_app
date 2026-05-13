/**
 * Phone/camera detection configuration for vault security.
 * These values tune the external device detection running on vault and media viewer screens.
 */

/** Frame processing frequency (FPS) for phone detection on vault screens */
export const PHONE_DETECTION_FPS = 12;

/** Confidence threshold (0.0-1.0) for object detection. Detections below this are ignored. */
export const CONFIDENCE_THRESHOLD = 0.65;

/**
 * Number of consecutive frames that must detect a device before blocking UI.
 * Higher = less false positives but slower response.
 */
export const CONSECUTIVE_FRAMES_REQUIRED = 3;

/** Delay in milliseconds before auto-unblocking after no detection. */
export const UNBLOCK_DELAY_MS = 500;

/**
 * COCO class indices to watch for.
 * MobileNetV2 trained on COCO dataset uses these standard object classes.
 */
export const PHONE_DETECTION_CLASSES = {
  CELL_PHONE: 'cell_phone',
  MOBILE_PHONE: 'mobile_phone',
  PHONE: 'phone',
  CAMERA: 'camera',
  CAMCORDER: 'camcorder',
};

/** List of class names to filter for (only these trigger blocking) */
export const MONITORED_CLASSES = [
  PHONE_DETECTION_CLASSES.CELL_PHONE,
  PHONE_DETECTION_CLASSES.MOBILE_PHONE,
  PHONE_DETECTION_CLASSES.PHONE,
  PHONE_DETECTION_CLASSES.CAMERA,
  PHONE_DETECTION_CLASSES.CAMCORDER,
];
