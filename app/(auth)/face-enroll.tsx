/**
 * Face enrollment — captures 3 face samples, averages the embeddings, persists to Supabase.
 * Requires the dev client (vision-camera + fast-tflite are native modules; Expo Go cannot run this).
 * On web we fall back to a notice and a skip path.
 */
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera,
  runAtTargetFps,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
  type CameraRuntimeError,
} from 'react-native-vision-camera';
import { useFaceDetector, type Face } from 'react-native-vision-camera-face-detector';
import { Worklets } from 'react-native-worklets-core';

import { ThemedText } from '@/components/themed-text';
import { ResponsiveWrapper } from '@/components/responsive-wrapper';
import { Colors, FontFamilies } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFaceModel } from '@/hooks/use-face-model';
import { useViewportDimensions } from '@/hooks/use-viewport-dimensions';
import {
  averageEmbeddings,
  embedFaceFromPhoto,
  saveEnrollment,
  type FaceBounds,
} from '@/lib/face-recognition';
import { supabase } from '@/lib/supabase';

const CAPTURES_REQUIRED = 3;

type EnrollPhase = 'idle' | 'detecting' | 'capturing' | 'saving' | 'done' | 'error';

export default function FaceEnrollScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const { isMobile } = useViewportDimensions();
  const { user } = useAuth();

  const faceCircleSize = isMobile ? 224 : 320;
  const faceCircleStroke = isMobile ? 10 : 14;

  if (Platform.OS === 'web') {
    return (
      <WebFallback
        onContinue={() => router.replace('/(tabs)')}
        onBack={() => router.back()}
        theme={theme}
      />
    );
  }

  return (
    <NativeEnrollScreen
      router={router}
      user={user}
      theme={theme}
      faceCircleSize={faceCircleSize}
      faceCircleStroke={faceCircleStroke}
      isMobile={isMobile}
    />
  );
}

function NativeEnrollScreen({
  router,
  user,
  theme,
  faceCircleSize,
  faceCircleStroke,
  isMobile,
}: {
  router: ReturnType<typeof useRouter>;
  user: ReturnType<typeof useAuth>['user'];
  theme: typeof Colors.light;
  faceCircleSize: number;
  faceCircleStroke: number;
  isMobile: boolean;
}) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const cameraRef = useRef<Camera>(null);

  const { model, state: modelState, error: modelError, downloadModel, progress } = useFaceModel();

  const { detectFaces } = useFaceDetector({
    performanceMode: 'fast',
    landmarkMode: 'none',
    classificationMode: 'all',
    contourMode: 'none',
    trackingEnabled: false,
    windowWidth: 480,
    windowHeight: 640,
  });

  const [phase, setPhase] = useState<EnrollPhase>('idle');
  const [faceOk, setFaceOk] = useState(false);
  const [lighting, setLighting] = useState(false);
  const [captureCount, setCaptureCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Last detected face bounds + frame dims (needed to map into photo coordinates when capturing)
  const lastFaceRef = useRef<{
    bounds: FaceBounds;
    frameWidth: number;
    frameHeight: number;
  } | null>(null);

  useEffect(() => {
    if (!hasPermission) {
      void requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const faceOkRef = useRef(false);
  const onFaces = Worklets.createRunOnJS(
    (faces: Face[], frameWidth: number, frameHeight: number) => {
      if (faces.length === 0) {
        if (faceOkRef.current) {
          faceOkRef.current = false;
          setFaceOk(false);
          setLighting(false);
        }
        return;
      }
      const face = faces.reduce((a, b) =>
        a.bounds.width * a.bounds.height > b.bounds.width * b.bounds.height ? a : b
      );
      const minSize = Math.min(frameWidth, frameHeight) * 0.25;
      const largeEnough = face.bounds.width >= minSize;
      lastFaceRef.current = {
        bounds: {
          x: face.bounds.x,
          y: face.bounds.y,
          width: face.bounds.width,
          height: face.bounds.height,
        },
        frameWidth,
        frameHeight,
      };
      if (largeEnough !== faceOkRef.current) {
        faceOkRef.current = largeEnough;
        setFaceOk(largeEnough);
        setLighting(largeEnough);
      }
    }
  );

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';
      runAtTargetFps(5, () => {
        'worklet';
        const faces = detectFaces(frame);
        onFaces(faces, frame.width, frame.height);
      });
    },
    [detectFaces]
  );

  const capture = useCallback(async () => {
    if (!cameraRef.current || !model) return null;
    if (!lastFaceRef.current) return null;

    const photo = await cameraRef.current.takePhoto({
      flash: 'off',
      enableShutterSound: false,
    });
    const photoUri = `file://${photo.path}`;

    const { bounds, frameWidth, frameHeight } = lastFaceRef.current;
    const scaleX = photo.width / frameWidth;
    const scaleY = photo.height / frameHeight;
    const scaledBounds: FaceBounds = {
      x: bounds.x * scaleX,
      y: bounds.y * scaleY,
      width: bounds.width * scaleX,
      height: bounds.height * scaleY,
    };

    return embedFaceFromPhoto(model, photoUri, scaledBounds, {
      photoWidth: photo.width,
      photoHeight: photo.height,
    });
  }, [model]);

  const runEnrollment = useCallback(async () => {
    if (!user?.id) {
      Alert.alert('Not signed in', 'Please sign in again to enroll.');
      return;
    }
    if (!model) {
      Alert.alert('Model loading', 'Face model is still loading. Try again in a moment.');
      return;
    }
    if (!faceOk) {
      Alert.alert('No face detected', 'Center your face in the circle first.');
      return;
    }

    setPhase('capturing');
    setErrorMsg(null);
    setCaptureCount(0);

    const embeddings: number[][] = [];
    try {
      for (let i = 0; i < CAPTURES_REQUIRED; i++) {
        // Small delay between captures so movement is reflected in the live bounds
        if (i > 0) await new Promise((r) => setTimeout(r, 450));
        const e = await capture();
        if (!e) throw new Error('Capture failed — no face detected');
        embeddings.push(e);
        setCaptureCount(i + 1);
      }
      setPhase('saving');
      const averaged = averageEmbeddings(embeddings);
      await saveEnrollment(user.id, averaged, {
        platform: Platform.OS,
        enrolledAt: new Date().toISOString(),
      });
      await supabase.from('logs').insert({
        user_id: user.id,
        name:
          user.user_metadata?.full_name ||
          user.email?.split('@')[0] ||
          'User',
        details: 'Face enrollment completed',
        device: Platform.OS,
        status: 'verified',
        type: 'success',
      });
      setPhase('done');
      setTimeout(() => router.replace('/(tabs)'), 600);
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Enrollment failed');
      setPhase('error');
    }
  }, [user, model, faceOk, capture, router]);

  const handleSkip = () => router.replace('/(tabs)');
  const handleBack = () => router.back();

  const onCameraError = (error: CameraRuntimeError) => {
    setErrorMsg(error.message);
    setPhase('error');
  };

  const instructionTitle =
    phase === 'capturing'
      ? `Hold still — ${captureCount}/${CAPTURES_REQUIRED}`
      : phase === 'saving'
        ? 'Saving enrollment…'
        : phase === 'done'
          ? 'Enrollment complete'
          : 'Look Straight at the\ncamera';

  const instructionSub =
    phase === 'error'
      ? errorMsg ?? 'Something went wrong.'
      : modelState === 'downloading'
        ? `Downloading model… ${progress ? Math.round(progress * 100) : 0}%`
        : modelState !== 'loaded'
          ? modelState === 'error'
            ? `Model failed to load${
                modelError && typeof modelError === 'object' && 'message' in modelError
                  ? `: ${(modelError as { message?: string }).message}`
                  : ''
              }`
            : 'Loading face model…'
          : 'Ensure your face is centered, well-lit and\nunobstructed by glasses or masks.';

  const canEnroll =
    hasPermission &&
    !!device &&
    modelState === 'loaded' &&
    faceOk &&
    phase !== 'capturing' &&
    phase !== 'saving' &&
    phase !== 'done';

  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ResponsiveWrapper maxWidth={500} style={styles.responsiveContent}>
          <View style={styles.header}>
            <Pressable onPress={handleBack} style={styles.backButton} hitSlop={12}>
              <MaterialIcons name="chevron-left" size={28} color={theme.text} />
            </Pressable>
            <ThemedText style={[styles.headerTitle, { color: theme.text }]}>
              Face Enrollment
            </ThemedText>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.pillsRow}>
            <StatusPill ok={lighting} label="Lighting" okIcon="check" idleIcon="wb-sunny" />
            <StatusPill
              ok={phase === 'capturing' || phase === 'saving'}
              label={phase === 'capturing' ? 'Capturing' : phase === 'saving' ? 'Saving' : 'Active'}
              okIcon="camera-alt"
              idleIcon="camera-alt"
              color="blue"
            />
            <StatusPill ok={faceOk} label="Pose" okIcon="check" idleIcon="refresh" color="grey" />
          </View>

          <View style={styles.faceGuideWrap}>
            <View
              style={[
                styles.faceCircleOuter,
                { width: faceCircleSize, height: faceCircleSize },
              ]}>
              <View
                style={[
                  styles.faceCircleRing,
                  {
                    borderColor: faceOk ? theme.accent : 'rgba(255,255,255,0.1)',
                    width: faceCircleSize,
                    height: faceCircleSize,
                    borderRadius: faceCircleSize / 2,
                    borderWidth: faceCircleStroke / 2,
                  },
                ]}
              />
              <View
                style={[
                  styles.faceCircleInner,
                  {
                    backgroundColor: theme.background,
                    width: faceCircleSize - 44,
                    height: faceCircleSize - 44,
                    borderRadius: (faceCircleSize - 44) / 2,
                  },
                ]}>
                {hasPermission && device ? (
                  <Camera
                    ref={cameraRef}
                    style={StyleSheet.absoluteFill}
                    device={device}
                    isActive={
                      phase !== 'saving' && phase !== 'done' && phase !== 'error'
                    }
                    photo
                    frameProcessor={frameProcessor}
                    onError={onCameraError}
                  />
                ) : (
                  <View style={[StyleSheet.absoluteFill, styles.placeholder]}>
                    <ActivityIndicator color={theme.accent} />
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={styles.bottomContent}>
            <ThemedText
              style={[
                styles.instructionTitle,
                { color: theme.text, fontSize: isMobile ? 24 : 32 },
              ]}>
              {instructionTitle}
            </ThemedText>
            <ThemedText style={[styles.instructionSub, { color: theme.mutedText }]}>
              {instructionSub}
            </ThemedText>

            {modelState === 'error' ? (
              <Pressable
                onPress={downloadModel}
                style={({ pressed }) => [
                  styles.enrollButton,
                  { backgroundColor: theme.primary, opacity: pressed ? 0.92 : 1 },
                ]}>
                <ThemedText style={styles.enrollButtonText}>Download Model</ThemedText>
                <MaterialIcons name="download" size={18} color="#FFF" />
              </Pressable>
            ) : (
              <Pressable
                onPress={runEnrollment}
                disabled={!canEnroll}
                style={({ pressed }) => [
                  styles.enrollButton,
                  {
                    backgroundColor: canEnroll ? theme.primary : 'rgba(128,128,128,0.4)',
                    opacity: pressed ? 0.92 : 1,
                  },
                ]}>
                {phase === 'capturing' || phase === 'saving' ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <ThemedText style={styles.enrollButtonText}>
                      {modelState === 'downloading' ? `Downloading… ${progress ? Math.round(progress * 100) : 0}%` : modelState !== 'loaded' ? 'Loading model…' : 'Enroll Face ID'}
                    </ThemedText>
                    <MaterialIcons name="face" size={18} color="#FFF" />
                  </>
                )}
              </Pressable>
            )}

            <Pressable
              onPress={handleSkip}
              style={({ pressed }) => [styles.skipWrap, { opacity: pressed ? 0.8 : 1 }]}>
              <ThemedText style={[styles.skipText, { color: theme.mutedText }]}>
                Skip for now
              </ThemedText>
            </Pressable>

            <View style={styles.footerSecure}>
              <MaterialIcons
                name="lock"
                size={18}
                color={theme.mutedText}
                style={{ opacity: 0.7 }}
              />
              <ThemedText style={[styles.footerSecureText, { color: theme.mutedText }]}>
                DIBS Secured. Biometric data is encrypted.
              </ThemedText>
            </View>
          </View>
        </ResponsiveWrapper>
      </SafeAreaView>
    </View>
  );
}

function StatusPill({
  ok,
  label,
  okIcon,
  idleIcon,
  color = 'green',
}: {
  ok: boolean;
  label: string;
  okIcon: keyof typeof MaterialIcons.glyphMap;
  idleIcon: keyof typeof MaterialIcons.glyphMap;
  color?: 'green' | 'blue' | 'grey';
}) {
  const palette =
    color === 'blue'
      ? styles.pillBlue
      : color === 'grey'
        ? styles.pillGrey
        : styles.pillGreen;
  return (
    <View style={[styles.pill, palette]}>
      <MaterialIcons name={ok ? okIcon : idleIcon} size={14} color="#FFF" />
      <ThemedText style={styles.pillText}>{label}</ThemedText>
    </View>
  );
}

function WebFallback({
  onContinue,
  onBack,
  theme,
}: {
  onContinue: () => void;
  onBack: () => void;
  theme: typeof Colors.light;
}) {
  return (
    <View style={[styles.screen, { backgroundColor: theme.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ResponsiveWrapper maxWidth={500} style={styles.responsiveContent}>
          <View style={styles.header}>
            <Pressable onPress={onBack} style={styles.backButton} hitSlop={12}>
              <MaterialIcons name="chevron-left" size={28} color={theme.text} />
            </Pressable>
            <ThemedText style={[styles.headerTitle, { color: theme.text }]}>
              Face Enrollment
            </ThemedText>
            <View style={styles.headerSpacer} />
          </View>

          <View style={[styles.bottomContent, { gap: 16, alignItems: 'center' }]}>
            <MaterialIcons name="phone-android" size={64} color={theme.mutedText} />
            <ThemedText style={[styles.instructionTitle, { color: theme.text, fontSize: 22 }]}>
              Available on mobile
            </ThemedText>
            <ThemedText style={[styles.instructionSub, { color: theme.mutedText }]}>
              Face enrollment uses on-device ML Kit + TensorFlow Lite.{'\n'}
              Install the dev client on your phone to enroll.
            </ThemedText>
            <Pressable
              onPress={onContinue}
              style={({ pressed }) => [
                styles.enrollButton,
                { backgroundColor: theme.primary, opacity: pressed ? 0.92 : 1, width: '100%' },
              ]}>
              <ThemedText style={styles.enrollButtonText}>Continue to app</ThemedText>
            </Pressable>
          </View>
        </ResponsiveWrapper>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  responsiveContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingTop: 10,
  },
  backButton: { padding: 4 },
  headerTitle: {
    fontSize: 18,
    fontFamily: FontFamilies.semiBold,
    lineHeight: 30,
  },
  headerSpacer: { width: 28 },
  pillsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 32,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 40,
  },
  pillGreen: {
    backgroundColor: 'rgba(73, 221, 127, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(73, 221, 127, 0.2)',
  },
  pillBlue: {
    backgroundColor: 'rgba(148, 199, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(148, 199, 255, 0.2)',
  },
  pillGrey: {
    backgroundColor: 'rgba(99, 106, 117, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(99, 106, 117, 0.2)',
  },
  pillText: { color: '#FFF', fontSize: 12, fontFamily: FontFamilies.medium },
  faceGuideWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  faceCircleOuter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceCircleRing: {
    position: 'absolute',
  },
  faceCircleInner: {
    overflow: 'hidden',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomContent: {
    flex: 1,
    justifyContent: 'center',
  },
  instructionTitle: {
    fontFamily: FontFamilies.medium,
    lineHeight: 32,
    letterSpacing: -1,
    textAlign: 'center',
    marginBottom: 8,
  },
  instructionSub: {
    fontSize: 14,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 28,
  },
  enrollButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 46,
    borderRadius: 10,
    marginBottom: 12,
  },
  enrollButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FontFamilies.semiBold,
  },
  skipWrap: { alignSelf: 'center', paddingVertical: 12, marginBottom: 24 },
  skipText: { fontSize: 14, fontFamily: FontFamilies.regular },
  footerSecure: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    opacity: 0.7,
    marginBottom: 20,
  },
  footerSecureText: { fontSize: 12, fontFamily: FontFamilies.regular },
});
