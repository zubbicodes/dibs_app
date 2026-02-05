import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import LottieView from 'lottie-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, FontFamilies } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLocalSearchParams, useRouter } from 'expo-router';

type VerificationState = 'scanning' | 'success' | 'failure';

export default function IdentityVerificationModal() {
  const router = useRouter();
  const { mediaId } = useLocalSearchParams<{ mediaId?: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const enableLayoutAnimations = process.env.EXPO_OS !== 'web';

  const [state, setState] = useState<VerificationState>('scanning');

  const targetLabel = useMemo(() => (mediaId ? `Media ID: ${mediaId}` : 'Media ID: —'), [mediaId]);

  useEffect(() => {
    setState('scanning');
    const timer = setTimeout(() => setState('success'), 1400);
    return () => clearTimeout(timer);
  }, [mediaId]);

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
            <ThemedText type="subtitle">Identity Verification</ThemedText>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }, styles.closeButton]}>
              <MaterialIcons name="close" size={18} color={theme.icon} />
            </Pressable>
          </View>

          <ThemedText style={{ color: theme.mutedText, marginBottom: 10 }}>{targetLabel}</ThemedText>

          <View style={[styles.faceFrame, { borderColor: statusColor }]}>
            {isScanning ? (
              <LottieView
                source={require('../assets/lottie/scan_line.json')}
                autoPlay
                loop
                style={styles.scanLottie}
              />
            ) : null}
            <MaterialIcons name="face" size={40} color={theme.primary} />
            {isScanning ? (
              <View style={styles.scannerRow}>
                <ThemedText style={{ color: theme.mutedText, fontFamily: FontFamilies.medium }}>
                  Scanning… Blink, then turn head
                </ThemedText>
              </View>
            ) : null}
          </View>

          <View style={styles.stateRow}>
            <MaterialIcons
              name={isSuccess ? 'check-circle' : state === 'failure' ? 'cancel' : 'hourglass-top'}
              size={20}
              color={statusColor}
            />
            <ThemedText style={{ fontFamily: FontFamilies.semiBold, color: statusColor }}>
              {isSuccess ? 'Access Granted' : state === 'failure' ? 'Access Denied' : 'Verifying'}
            </ThemedText>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={() => setState('success')}
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
              onPress={() => setState('failure')}
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
    padding: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  faceFrame: {
    height: 150,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    gap: 8,
  },
  scanLottie: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.9,
  },
  scannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
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
