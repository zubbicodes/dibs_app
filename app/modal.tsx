import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import LottieView from 'lottie-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, FontFamilies } from '@/constants/theme';
import { useDemoSession } from '@/hooks/demo-session';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLocalSearchParams, useRouter } from 'expo-router';

type VerificationState = 'scanning' | 'success' | 'failure';

export default function IdentityVerificationModal() {
  const router = useRouter();
  const { mediaId } = useLocalSearchParams<{ mediaId?: string }>();
  const { verifyVault, resetVaultVerification } = useDemoSession();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const enableLayoutAnimations = process.env.EXPO_OS !== 'web';

  const [state, setState] = useState<VerificationState>('scanning');

  const targetLabel = useMemo(() => (mediaId ? `Media ID: ${mediaId}` : 'Media ID: —'), [mediaId]);

  const isScanning = state === 'scanning';
  const isSuccess = state === 'success';
  const statusColor = isSuccess ? theme.success : state === 'failure' ? theme.danger : theme.accent;

  return (
    <ThemedView
      style={styles.screen}
      lightColor="rgba(0, 0, 0, 0.28)"
      darkColor="rgba(0, 0, 0, 0.62)">
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <Pressable onPress={() => router.back()} style={styles.backdrop} />

        <Animated.View
          style={[styles.card, { backgroundColor: theme.surface2, borderColor: theme.border }]}
          {...(enableLayoutAnimations ? { entering: FadeInUp.duration(220) } : {})}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderText}>
              <ThemedText type="subtitle">Identity Verification</ThemedText>
              <ThemedText style={[styles.subtitleText, { color: theme.mutedText }]}>
                Securely confirm your identity to unlock the vault.
              </ThemedText>
            </View>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }, styles.closeButton]}>
              <MaterialIcons name="close" size={18} color={theme.icon} />
            </Pressable>
          </View>

          <View style={styles.metaRow}>
            <View style={[styles.metaPill, { backgroundColor: theme.surface }]}>
              <MaterialIcons name="shield" size={14} color={theme.primary} />
              <ThemedText style={{ fontFamily: FontFamilies.semiBold, fontSize: 12 }}>Secure Check</ThemedText>
            </View>
            <ThemedText
              style={[styles.targetLabel, { color: theme.mutedText }]}
              numberOfLines={1}
              ellipsizeMode="tail">
              {targetLabel}
            </ThemedText>
          </View>

          <View style={[styles.scanCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.scanHeader}>
              <View style={styles.scanHeaderText}>
                <ThemedText style={{ fontFamily: FontFamilies.semiBold }}>Face Scan</ThemedText>
                <ThemedText style={{ color: theme.mutedText, marginTop: 2 }}>
                  Align your face within the frame.
                </ThemedText>
              </View>
              <View style={[styles.statusPill, { backgroundColor: theme.surface2, borderColor: statusColor }]}>
                <MaterialIcons
                  name={isSuccess ? 'check-circle' : state === 'failure' ? 'cancel' : 'hourglass-top'}
                  size={14}
                  color={statusColor}
                />
                <ThemedText style={{ fontFamily: FontFamilies.semiBold, color: statusColor, fontSize: 12 }}>
                  {isSuccess ? 'Verified' : state === 'failure' ? 'Failed' : 'Scanning'}
                </ThemedText>
              </View>
            </View>

            <View style={[styles.faceFrame, { borderColor: statusColor }]}>
              <View style={styles.faceImageWrap}>
                <Image
                  source={require('../assets/face.gif')}
                  style={styles.faceImage}
                  contentFit="contain"
                  contentPosition="center"
                />
              </View>
              {isScanning ? (
                <LottieView
                  source={require('../assets/lottie/scan_line.json')}
                  autoPlay
                  loop
                  style={styles.scanLottie}
                />
              ) : null}
            </View>

            <View style={styles.scanFooter}>
              <MaterialIcons name="lightbulb" size={18} color={theme.icon} />
              <ThemedText style={[styles.scanFooterText, { color: theme.mutedText }]} numberOfLines={2}>
                Remove hats or glasses, keep a neutral expression, and stay still.
              </ThemedText>
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={() => {
                setState('success');
                verifyVault();
                setTimeout(() => router.back(), 250);
              }}
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  backgroundColor: theme.primary,
                  opacity: pressed ? 0.86 : 1,
                },
              ]}>
              <ThemedText style={{ color: '#FFFFFF', fontFamily: FontFamilies.semiBold }}>
                Simulate Success
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={() => {
                setState('failure');
                resetVaultVerification();
              }}
              style={({ pressed }) => [
                styles.outlineButton,
                {
                  borderColor: theme.danger,
                  opacity: pressed ? 0.86 : 1,
                },
              ]}>
              <ThemedText style={{ color: theme.danger, fontFamily: FontFamilies.semiBold }}>
                Simulate Failure
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.ghostButton,
                {
                  borderColor: theme.border,
                  opacity: pressed ? 0.86 : 1,
                },
              ]}>
              <ThemedText style={{ color: theme.mutedText, fontFamily: FontFamilies.semiBold }}>
                Close
              </ThemedText>
            </Pressable>
          </View>
        </Animated.View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  cardHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  subtitleText: {
    marginTop: 4,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  scanCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
    gap: 12,
  },
  scanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    flexWrap: 'wrap',
  },
  scanHeaderText: {
    flex: 1,
    minWidth: 0,
  },
  targetLabel: {
    flex: 1,
    textAlign: 'right',
    minWidth: 0,
    flexShrink: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  faceFrame: {
    height: 180,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  scanLottie: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9,
  },
  faceImageWrap: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceImage: {
    width: 120,
    height: 120,
  },
  scanFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  scanFooterText: {
    fontFamily: FontFamilies.medium,
    flex: 1,
  },
  actions: {
    gap: 8,
  },
  primaryButton: {
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineButton: {
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  ghostButton: {
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
