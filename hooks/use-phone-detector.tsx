/**
 * Phone detection context hook for vault security.
 *
 * Provides app-wide state tracking for detected external devices.
 * Automatically clears detection state after UNBLOCK_DELAY_MS of no detection signal.
 */

import { CONSECUTIVE_FRAMES_REQUIRED, UNBLOCK_DELAY_MS } from '@/constants/detection';
import type { PhoneDetectionResult } from '@/lib/phone-detector';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

type PhoneDetectionContextValue = {
  /** True when external device is currently detected and UI should be blocked */
  isExternalDeviceDetected: boolean;
  /** Confidence score of current detection (0.0-1.0) */
  confidence: number;
  /** Update detection state from frame processor */
  updateDetectionState: (result: PhoneDetectionResult) => void;
  /** Manually reset detection (for testing/reset scenarios) */
  resetDetection: () => void;
};

const PhoneDetectionContext = createContext<PhoneDetectionContextValue | null>(null);

export function PhoneDetectionProvider({ children }: { children: ReactNode }) {
  const [isExternalDeviceDetected, setIsExternalDeviceDetected] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const isExternalDeviceDetectedRef = useRef(false);
  const consecutiveDetectionsRef = useRef(0);
  const unblockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Called by frame processor on each processed frame.
   * Implements smoothing: requires N consecutive detections before blocking.
   */
  const updateDetectionState = useCallback((result: PhoneDetectionResult) => {
    if (result.detected) {
      if (unblockTimeoutRef.current) {
        clearTimeout(unblockTimeoutRef.current);
        unblockTimeoutRef.current = null;
      }
      consecutiveDetectionsRef.current++;
      setConfidence(result.confidence);

      if (
        consecutiveDetectionsRef.current >= CONSECUTIVE_FRAMES_REQUIRED &&
        !isExternalDeviceDetectedRef.current
      ) {
        isExternalDeviceDetectedRef.current = true;
        setIsExternalDeviceDetected(true);
      }
    } else {
      consecutiveDetectionsRef.current = 0;

      if (isExternalDeviceDetectedRef.current && !unblockTimeoutRef.current) {
        unblockTimeoutRef.current = setTimeout(() => {
          isExternalDeviceDetectedRef.current = false;
          setIsExternalDeviceDetected(false);
          setConfidence(0);
          unblockTimeoutRef.current = null;
        }, UNBLOCK_DELAY_MS);
      }
    }
  }, []);

  const resetDetection = useCallback(() => {
    if (unblockTimeoutRef.current) {
      clearTimeout(unblockTimeoutRef.current);
      unblockTimeoutRef.current = null;
    }
    isExternalDeviceDetectedRef.current = false;
    setIsExternalDeviceDetected(false);
    setConfidence(0);
    consecutiveDetectionsRef.current = 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (unblockTimeoutRef.current) {
        clearTimeout(unblockTimeoutRef.current);
      }
    };
  }, []);

  const value = useMemo<PhoneDetectionContextValue>(
    () => ({
      isExternalDeviceDetected,
      confidence,
      updateDetectionState,
      resetDetection,
    }),
    [isExternalDeviceDetected, confidence, updateDetectionState, resetDetection]
  );

  return (
    <PhoneDetectionContext.Provider value={value}>
      {children}
    </PhoneDetectionContext.Provider>
  );
}

export function usePhoneDetection(): PhoneDetectionContextValue {
  const ctx = useContext(PhoneDetectionContext);
  if (!ctx) {
    throw new Error('usePhoneDetection must be used within a <PhoneDetectionProvider>');
  }
  return ctx;
}
