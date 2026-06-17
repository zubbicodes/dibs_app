import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, FontFamilies } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useViewportDimensions } from '@/hooks/use-viewport-dimensions';
import { supabase } from '@/lib/supabase';

type VerificationState = 'authenticating' | 'code' | 'submitting' | 'approved' | 'failed';

export default function PushVerificationScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ challengeId?: string; code?: string }>();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { user } = useAuth();
  const { width, isMobile } = useViewportDimensions();
  const [state, setState] = useState<VerificationState>('authenticating');
  const [inputCode, setInputCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cardWidth = isMobile ? Math.min(width - 48, 360) : 420;
  const challengeId = Array.isArray(params.challengeId) ? params.challengeId[0] : params.challengeId;
  const expectedCode = Array.isArray(params.code) ? params.code[0] : params.code;

  const isValidRequest = useMemo(
    () => Boolean(challengeId && expectedCode && /^\d{2}$/.test(expectedCode)),
    [challengeId, expectedCode]
  );

  useEffect(() => {
    if (!isValidRequest) {
      setState('failed');
      setErrorMessage('Verification request is missing a valid challenge.');
      return;
    }

    let cancelled = false;

    async function authenticate() {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!hasHardware || !isEnrolled) {
        setErrorMessage('Biometric authentication is not available on this device.');
        setState('code');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Approve DIBS web unlock',
        fallbackLabel: 'Use device passcode',
        cancelLabel: 'Cancel',
      });

      if (cancelled) return;

      if (result.success) {
        setState('code');
        return;
      }

      setState('failed');
      setErrorMessage('Biometric authentication was cancelled or failed.');
    }

    void authenticate();

    return () => {
      cancelled = true;
    };
  }, [isValidRequest]);

  const rejectChallenge = useCallback(async () => {
    if (challengeId) {
      await supabase.from('auth_challenges').update({ status: 'rejected' }).eq('id', challengeId);
    }
    router.back();
  }, [challengeId, router]);

  const approveChallenge = useCallback(async () => {
    if (!challengeId || !expectedCode || !user?.id) return;

    if (inputCode !== expectedCode) {
      setState('failed');
      setErrorMessage('The 2-digit code does not match the web screen.');
      await supabase.from('auth_challenges').update({ status: 'rejected' }).eq('id', challengeId);
      return;
    }

    setState('submitting');
    const { error } = await supabase
      .from('auth_challenges')
      .update({ status: 'approved' })
      .eq('id', challengeId)
      .eq('user_id', user.id);

    if (error) {
      setState('failed');
      setErrorMessage(error.message);
      return;
    }

    setState('approved');
    Alert.alert('Approved', 'The web secure section is unlocked.', [
      { text: 'Done', onPress: () => router.back() },
    ]);
  }, [challengeId, expectedCode, inputCode, router, user?.id]);

  const statusText =
    state === 'authenticating'
      ? 'Confirm your identity to approve this web unlock request.'
      : state === 'approved'
        ? 'Request approved.'
        : state === 'failed'
          ? errorMessage ?? 'Verification failed.'
          : errorMessage
            ? `${errorMessage} Enter the 2-digit code shown on the web app.`
            : 'Enter the 2-digit code shown on the web app.';

  const statusColor =
    state === 'approved'
      ? theme.success
      : state === 'failed'
        ? theme.danger
        : theme.accent;

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View
          style={[
            styles.card,
            {
              width: cardWidth,
              backgroundColor: colorScheme === 'dark' ? '#11141C' : theme.surface,
              borderColor: theme.cardTintBorder,
            },
          ]}>
          <View style={[styles.iconWrap, { backgroundColor: theme.cardTint }]}>
            <MaterialIcons name="phonelink-lock" size={32} color={theme.accent} />
          </View>

          <ThemedText style={[styles.title, { color: theme.text }]}>Approve Web Unlock</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.mutedText }]}>{statusText}</ThemedText>

          {state === 'authenticating' || state === 'submitting' ? (
            <ActivityIndicator color={theme.accent} style={styles.loader} />
          ) : null}

          {state === 'code' ? (
            <>
              <TextInput
                value={inputCode}
                onChangeText={(value) => setInputCode(value.replace(/\D/g, '').slice(0, 2))}
                keyboardType="number-pad"
                maxLength={2}
                autoFocus
                placeholder="00"
                placeholderTextColor={`${theme.mutedText}88`}
                style={[
                  styles.codeInput,
                  {
                    color: theme.text,
                    backgroundColor: theme.inputBg,
                    borderColor: theme.inputBorder,
                  },
                ]}
              />

              <Pressable
                onPress={approveChallenge}
                disabled={inputCode.length !== 2}
                style={({ pressed }) => [
                  styles.primaryButton,
                  {
                    backgroundColor: theme.primary,
                    opacity: pressed || inputCode.length !== 2 ? 0.76 : 1,
                  },
                ]}>
                <MaterialIcons name="check" size={20} color="#FFFFFF" />
                <ThemedText style={styles.primaryButtonText}>Confirm Code</ThemedText>
              </Pressable>
            </>
          ) : null}

          <View
            style={[
              styles.statusPill,
              {
                backgroundColor: `${statusColor}22`,
                borderColor: statusColor,
              },
            ]}>
            <MaterialIcons
              name={state === 'failed' ? 'error-outline' : state === 'approved' ? 'check-circle' : 'security'}
              size={14}
              color={statusColor}
            />
            <ThemedText style={[styles.statusText, { color: statusColor }]}>
              {state === 'authenticating'
                ? 'Biometric check'
                : state === 'code'
                  ? 'Code required'
                  : state === 'approved'
                    ? 'Approved'
                    : state === 'submitting'
                      ? 'Approving'
                      : 'Failed'}
            </ThemedText>
          </View>

          <Pressable onPress={rejectChallenge} style={({ pressed }) => [styles.cancelButton, pressed && { opacity: 0.8 }]}>
            <ThemedText style={[styles.cancelButtonText, { color: theme.mutedText }]}>
              Cancel Request
            </ThemedText>
          </Pressable>
        </View>
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    maxWidth: '100%',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  title: {
    fontFamily: FontFamilies.semiBold,
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: FontFamilies.regular,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 22,
  },
  loader: {
    marginBottom: 20,
  },
  codeInput: {
    width: 118,
    height: 68,
    borderRadius: 12,
    borderWidth: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontFamily: FontFamilies.bold,
    fontSize: 34,
    lineHeight: 40,
    paddingHorizontal: 0,
    paddingVertical: 0,
    includeFontPadding: false,
    marginBottom: 18,
  },
  primaryButton: {
    width: 230,
    height: 48,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: FontFamilies.semiBold,
    fontSize: 14,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 40,
    borderWidth: 1,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: FontFamilies.medium,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cancelButtonText: {
    fontSize: 14,
    fontFamily: FontFamilies.medium,
  },
});
