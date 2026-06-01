/**
 * Verify Identity modal — app-level face recognition unlock.
 *
 * Flow:
 *   1. Load the user's enrolled embedding from Supabase.
 *   2. Run vision-camera with a live face-detection frame processor.
 *   3. Require a blink (liveness) before capturing.
 *   4. Capture → crop face → MobileFaceNet embedding → cosine-similarity vs enrollment.
 *   5. If sim ≥ MATCH_THRESHOLD → log success, mark vault verified, route to vault.
 *
 * The "Use Pin Instead" button still falls back to the OS biometric gate
 * (expo-local-authentication) for users without a front camera or when
 * face recognition fails repeatedly.
 */
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera,
  runAtTargetFps,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
  useFaceDetector,
  type Face,
  Worklets,
} from '@/lib/native-camera';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, FontFamilies } from '@/constants/theme';
import { useDemoSession } from '@/hooks/demo-session';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFaceModel } from '@/hooks/use-face-model';
import { useViewportDimensions } from '@/hooks/use-viewport-dimensions';
import {
  cosineSimilarity,
  embedFaceFromPhoto,
  getEnrollment,
  MATCH_THRESHOLD,
  nextLivenessState,
  type FaceBounds,
  type LivenessState,
} from '@/lib/face-recognition';
import { supabase } from '@/lib/supabase';

type AuthStatus = 'preparing' | 'scanning' | 'matching' | 'success' | 'failed';

export default function IdentityVerificationModal() {
  const router = useRouter();
  const { verifyVault } = useDemoSession();
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const { width, isMobile } = useViewportDimensions();
  const cardWidth = isMobile ? Math.min(width - 48, 340) : 420;
  const faceSize = isMobile ? 174 : 220;

  if (Platform.OS === 'web') {
    return (
      <VerificationShell
        cardWidth={cardWidth}
        faceSize={faceSize}
        theme={theme}
        colorScheme={colorScheme}
        statusMessage="Face unlock is only available on the mobile app."
        statusColor={theme.mutedText}
        statusIcon="phone-android"
        instruction="Open DIBS on your phone to unlock the vault."
        content={<View style={{ flex: 1 }} />}
        onUsePin={async () => {}}
        onCancel={() => router.back()}
      />
    );
  }

  return (
    <NativeVerificationModal
      router={router}
      verifyVault={verifyVault}
      user={user}
      theme={theme}
      colorScheme={colorScheme}
      cardWidth={cardWidth}
      faceSize={faceSize}
    />
  );
}

function NativeVerificationModal({
  router,
  verifyVault,
  user,
  theme,
  colorScheme,
  cardWidth,
  faceSize,
}: {
  router: ReturnType<typeof useRouter>;
  verifyVault: () => void;
  user: ReturnType<typeof useAuth>['user'];
  theme: typeof Colors.light;
  colorScheme: 'light' | 'dark';
  cardWidth: number;
  faceSize: number;
}) {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const cameraRef = useRef<Camera>(null);

  const { model } = useFaceModel();

  const { detectFaces } = useFaceDetector({
    performanceMode: 'fast',
    landmarkMode: 'none',
    classificationMode: 'all',
    contourMode: 'none',
    trackingEnabled: false,
    windowWidth: 480,
    windowHeight: 640,
  });

  const [status, setStatus] = useState<AuthStatus>('preparing');
  const [liveness, setLiveness] = useState<LivenessState>('idle');
  const [enrollment, setEnrollment] = useState<number[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const lastFaceRef = useRef<{
    bounds: FaceBounds;
    frameWidth: number;
    frameHeight: number;
  } | null>(null);
  const livenessRef = useRef<LivenessState>('idle');
  const isVerifyingRef = useRef(false);

  useEffect(() => {
    if (!hasPermission) void requestPermission();
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    if (!user?.id) return;
    getEnrollment(user.id)
      .then((e) => {
        if (!e) {
          setStatus('failed');
          setErrorMsg('No face enrollment found. Please enroll your face first.');
        } else {
          setEnrollment(e);
          setStatus('scanning');
          setLiveness('look-straight');
          livenessRef.current = 'look-straight';
        }
      })
      .catch((err) => {
        setStatus('failed');
        setErrorMsg(err?.message ?? 'Failed to load enrollment');
      });
  }, [user?.id]);

  const runMatch = useCallback(async () => {
    if (isVerifyingRef.current) return;
    if (!cameraRef.current || !model || !enrollment || !lastFaceRef.current || !user?.id) {
      return;
    }
    isVerifyingRef.current = true;
    setStatus('matching');
    try {
      const photo = await cameraRef.current.takePhoto({
        flash: 'off',
        enableShutterSound: false,
      });
      const photoUri = `file://${photo.path}`;

      const { bounds, frameWidth, frameHeight } = lastFaceRef.current;
      const scaleX = photo.width / frameWidth;
      const scaleY = photo.height / frameHeight;
      const scaled: FaceBounds = {
        x: bounds.x * scaleX,
        y: bounds.y * scaleY,
        width: bounds.width * scaleX,
        height: bounds.height * scaleY,
      };

      const live = await embedFaceFromPhoto(model, photoUri, scaled, {
        photoWidth: photo.width,
        photoHeight: photo.height,
      });
      const sim = cosineSimilarity(live, enrollment);
      const ok = sim >= MATCH_THRESHOLD;

      const name =
        user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

      if (ok) {
        setStatus('success');
        verifyVault();
        await supabase.from('logs').insert({
          user_id: user.id,
          name,
          details: `Face match verified (similarity ${sim.toFixed(3)})`,
          device: Platform.OS,
          status: 'verified',
          type: 'success',
        });
        setTimeout(() => router.back(), 500);
      } else {
        setStatus('failed');
        setErrorMsg(`Face did not match (similarity ${sim.toFixed(3)})`);
        await supabase.from('logs').insert({
          user_id: user.id,
          name,
          details: `Face match failed (similarity ${sim.toFixed(3)})`,
          device: Platform.OS,
          status: 'blocked',
          type: 'danger',
        });
      }
    } catch (err: any) {
      setStatus('failed');
      setErrorMsg(err?.message ?? 'Verification failed');
    } finally {
      isVerifyingRef.current = false;
    }
  }, [model, enrollment, user, verifyVault, router]);

  const statusRef = useRef<AuthStatus>('preparing');
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const onFaces = Worklets.createRunOnJS(
    (faces: Face[], frameWidth: number, frameHeight: number) => {
      if (faces.length === 0) {
        if (livenessRef.current !== 'passed' && livenessRef.current !== 'look-straight') {
          livenessRef.current = 'look-straight';
          setLiveness('look-straight');
        }
        return;
      }
      const face = faces.reduce((a, b) =>
        a.bounds.width * a.bounds.height > b.bounds.width * b.bounds.height ? a : b
      );
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
      if (statusRef.current === 'scanning') {
        const next = nextLivenessState(livenessRef.current, {
          leftEyeOpenProbability: face.leftEyeOpenProbability,
          rightEyeOpenProbability: face.rightEyeOpenProbability,
        });
        if (next !== livenessRef.current) {
          livenessRef.current = next;
          setLiveness(next);
          if (next === 'passed') {
            void runMatch();
          }
        }
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

  const handleUsePin = useCallback(async () => {
    const has = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!has || !enrolled) {
      setStatus('failed');
      setErrorMsg('Device passcode not available.');
      return;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Enter Device PIN for Access',
      fallbackLabel: 'Use PIN',
      cancelLabel: 'Cancel',
    });
    if (result.success && user?.id) {
      setStatus('success');
      verifyVault();
      await supabase.from('logs').insert({
        user_id: user.id,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        details: 'Device Passcode Fallback Verified',
        device: Platform.OS,
        status: 'verified',
        type: 'success',
      });
      setTimeout(() => router.back(), 400);
    }
  }, [router, user, verifyVault]);

  const statusMessage =
    status === 'success'
      ? 'Verified Successfully'
      : status === 'failed'
        ? errorMsg || 'Verification Failed'
        : status === 'matching'
          ? 'Matching…'
          : liveness === 'look-straight'
            ? 'Look straight at the camera'
            : liveness === 'eyes-closed'
              ? 'Now close your eyes'
              : liveness === 'eyes-open-again'
                ? 'Open your eyes'
                : liveness === 'passed'
                  ? 'Capturing…'
                  : 'Preparing…';

  const statusColor =
    status === 'success'
      ? theme.success
      : status === 'failed'
        ? theme.danger
        : theme.accent;

  const statusIcon: keyof typeof MaterialIcons.glyphMap =
    status === 'success'
      ? 'check-circle'
      : status === 'failed'
        ? 'error-outline'
        : 'videocam';

  const cameraContent =
    hasPermission && device ? (
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={status === 'scanning' || status === 'matching'}
        photo
        frameProcessor={frameProcessor}
      />
    ) : (
      <View style={[StyleSheet.absoluteFill, styles.placeholder]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );

  const instruction =
    status === 'failed'
      ? 'Try again or use your device PIN.'
      : 'Remove hats or glasses, keep a neutral expression and stay still.';

  return (
    <VerificationShell
      cardWidth={cardWidth}
      faceSize={faceSize}
      theme={theme}
      colorScheme={colorScheme}
      statusMessage={statusMessage}
      statusColor={statusColor}
      statusIcon={statusIcon}
      instruction={instruction}
      content={cameraContent}
      onUsePin={handleUsePin}
      onCancel={() => router.back()}
    />
  );
}

function VerificationShell({
  cardWidth,
  faceSize,
  theme,
  colorScheme,
  statusMessage,
  statusColor,
  statusIcon,
  instruction,
  content,
  onUsePin,
  onCancel,
}: {
  cardWidth: number;
  faceSize: number;
  theme: typeof Colors.light;
  colorScheme: 'light' | 'dark';
  statusMessage: string;
  statusColor: string;
  statusIcon: keyof typeof MaterialIcons.glyphMap;
  instruction: string;
  content: React.ReactNode;
  onUsePin: () => void | Promise<void>;
  onCancel: () => void;
}) {
  const cardBg = colorScheme === 'dark' ? '#11141C' : theme.surface;

  return (
    <ThemedView
      style={styles.screen}
      lightColor="rgba(0, 0, 0, 0.45)"
      darkColor="#070A12">
      <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          <Animated.View
            entering={FadeIn.duration(220)}
            style={[
              styles.card,
              {
                width: cardWidth,
                backgroundColor: cardBg,
                borderColor: theme.cardTintBorder,
              },
            ]}>
            <View style={[styles.iconWrap, { backgroundColor: theme.cardTint }]}>
              <MaterialIcons name="lock" size={32} color={theme.accent} />
            </View>
            <ThemedText style={[styles.title, { color: theme.text }]}>
              Verify Identity
            </ThemedText>
            <ThemedText style={[styles.subtitle, { color: theme.mutedText }]}>
              Securely confirm your identity to unlock the vault.
            </ThemedText>

            <View
              style={[
                styles.instructionBox,
                { backgroundColor: theme.cardTint, borderColor: theme.cardTintBorder },
              ]}>
              <MaterialIcons
                name="lightbulb-outline"
                size={24}
                color={theme.mutedText}
                style={{ opacity: 0.7 }}
              />
              <ThemedText style={[styles.instructionText, { color: theme.mutedText }]}>
                {instruction}
              </ThemedText>
            </View>

            <View
              style={[
                styles.faceFrame,
                { width: faceSize, height: faceSize, borderColor: theme.accent, borderRadius: 18 },
              ]}>
              {content}
            </View>

            <View
              style={[
                styles.scanningPill,
                {
                  backgroundColor: `${statusColor}22`,
                  borderColor: statusColor,
                },
              ]}>
              <MaterialIcons name={statusIcon} size={14} color={statusColor} />
              <ThemedText style={[styles.scanningText, { color: statusColor }]}>
                {statusMessage}
              </ThemedText>
            </View>

            <Pressable
              onPress={onUsePin}
              style={({ pressed }) => [
                styles.primaryButton,
                { backgroundColor: theme.primary, opacity: pressed ? 0.9 : 1 },
              ]}>
              <ThemedText style={styles.primaryButtonText}>Use Pin Instead</ThemedText>
            </Pressable>

            <Pressable
              onPress={onCancel}
              style={({ pressed }) => [styles.cancelButton, pressed && { opacity: 0.8 }]}>
              <ThemedText style={[styles.cancelButtonText, { color: theme.mutedText }]}>
                Cancel Verification
              </ThemedText>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 28,
  },
  card: {
    maxWidth: '100%',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
    alignItems: 'center',
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 18,
    fontFamily: FontFamilies.semiBold,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  instructionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 24,
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  faceFrame: {
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 20,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanningPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 40,
    borderWidth: 1,
    marginBottom: 24,
  },
  scanningText: {
    fontSize: 12,
    fontFamily: FontFamilies.medium,
  },
  primaryButton: {
    width: 230,
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#FFF', fontSize: 14, fontFamily: FontFamilies.semiBold },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelButtonText: { fontSize: 14, opacity: 0.7 },
});
