# Plan: External Device Detection for Vault Protection

## TL;DR
Implement real-time detection of external phones/cameras **only in vault browsing and media viewer screens**. When a user is browsing media or viewing individual items, a hidden front-facing camera runs in background detecting phones/cameras pointed at the screen. If detected, block all interactions with full-screen overlay + message. Requires 0.5s of device removal before unblocking. Uses TensorFlow Lite MobileNetV2 object detection at 10-15 FPS with 3-frame smoothing.

## Steps

### Phase 1: Model Setup & Infrastructure
1. **Acquire TFLite MobileNetV2 model**
   - Download quantized COCO-trained MobileNetV2 SSD model (~4.5MB)
   - Store at `assets/models/mobilenet-ssd.tflite`

2. **Create phone detection pipeline** (`lib/phone-detector.ts`)
   - Load via `react-native-fast-tflite`
   - `detectExternalDevices(frame, model)` → `{ detected: boolean, confidence, classes }`
   - Handle 300×300 frame resizing, confidence filtering (0.65 threshold)
   - Filter classes: cell_phone, mobile_phone, phone, camera, camcorder

3. **Create phone detector context hook** (`hooks/use-phone-detector.tsx`)
   - State: `{ isExternalDeviceDetected, confidence, resetAfter500ms }`
   - Similar pattern to `useScreenshotProtection` (context + provider)
   - Auto-clear after 0.5s with no detection signal

### Phase 2: Vault Screen Integration (*depends on Phase 1*)
4. **Add background camera to vault screen** (`app/(tabs)/vault.tsx`)
   - Add hidden front Camera component (opacity: 0, zero dimensions)
   - Set up frame processor at 10-15 FPS to run phone detection
   - Pass frames to phone detector context
   - Camera only active when screen is focused

5. **Add background camera to viewer screen** (`app/viewer.tsx`)
   - Same setup as vault: hidden camera + frame processor
   - Camera active when viewing individual media

### Phase 3: UI Blocking & Overlay (*depends on Phase 2*)
6. **Create phone detection overlay component** (`components/phone-detector-overlay.tsx`)
   - Full-screen overlay (position: absolute, zIndex: 999)
   - Semi-transparent dark background + centered message
   - Message: "🚫 Camera Detected — Move the external device away"
   - Show countdown (0.5s timer visual)
   - Overlay freezes all underlying UI interactions

7. **Integrate overlay into vault and viewer** (*depends on Phase 3*)
   - Add `<PhoneDetectorOverlay />` as last child in both screens
   - Conditionally render when `isExternalDeviceDetected === true`
   - Ensure it's above all other UI elements

### Phase 4: Logging & Audit Trail
8. **Create detection logger** (`lib/phone-detection-logger.ts`)
   - `logPhoneDetectionEvent(userId, screen, confidence, metadata)`
   - Event types: 'DETECTED', 'CLEARED'

9. **Create Supabase migration** (`supabase/migrations/20260512_vault_phone_detection_logs.sql`)
   - Table: `vault_phone_detection_logs`
   - Columns: id, user_id, screen (vault|viewer), event_type, confidence, timestamp, metadata

### Phase 5: Configuration & Testing
10. **Add constants** (`constants/detection.ts`)
    - `PHONE_DETECTION_FPS = 12`
    - `CONFIDENCE_THRESHOLD = 0.65`
    - `CONSECUTIVE_FRAMES_REQUIRED = 3`
    - `UNBLOCK_DELAY_MS = 500`

11. **Manual testing**
    - Open vault screen → point phone camera → verify overlay blocks UI
    - Remove phone → verify unblocks after 0.5s
    - Test in media viewer (open individual image/video → repeat)
    - Verify no false positives from reflections/screens

12. **Performance check**
    - Frame processing <50ms overhead per frame
    - Model inference + frame processing should stay <100ms total
    - Camera hidden (0 opacity/size) minimal battery impact

## Relevant files
- **Vault screen**: [app/(tabs)/vault.tsx](app/(tabs)/vault.tsx#L35-L80) — add Camera component here
- **Viewer screen**: [app/viewer.tsx](app/viewer.tsx#L50-L100) — add Camera component here
- **Reference patterns**:
  - Frame processor: [app/modal.tsx](app/modal.tsx#L281-L291)
  - Model loading: [hooks/use-face-model.tsx](hooks/use-face-model.tsx)
  - Context hook: [hooks/use-screenshot-protection.tsx](hooks/use-screenshot-protection.tsx)
- **Model location**: [assets/models/](assets/models/)

## Verification
1. Vault screen: camera runs hidden, phone detection active, overlay blocks on detection
2. Viewer screen: same behavior when viewing individual media
3. Overlay freezes UI (no button taps, swipes blocked)
4. Auto-unblock after 0.5s of clean frames
5. Supabase logs populated with detection events

## Decisions
- **Scope**: Vault + viewer screens ONLY (not enrollment/verification)
- **Camera**: Hidden, front-facing, runs only when screen is focused
- **Confidence**: 0.65 threshold + 3 consecutive frames before blocking
- **Unblock delay**: 0.5s for gentle UX
- **Logging**: Supabase for audit trail

## Further Considerations
1. **Privacy notification**: Should settings/onboarding explain that vault screens run camera for detection?
   - Recommendation: Add toggle in settings to disable phone detection if user prefers (with security warning)
   
2. **Battery impact**: Hidden camera running on vault browse might drain battery. Consider:
   - Recommendation: Only enable when media is actually being viewed (not just scrolling)?
   
3. **Platform differences**: Does Android/iOS handle hidden cameras differently?
   - Recommendation: Test thoroughly on both; may need platform-specific handling
