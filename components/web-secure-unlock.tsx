import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Colors, FontFamilies } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';

type ChallengeStatus = 'pending' | 'approved' | 'rejected' | 'expired';

type AuthChallenge = {
  id: string;
  user_id: string;
  code: string;
  status: ChallengeStatus;
  created_at: string;
};

type CreateChallengeResponse = Pick<AuthChallenge, 'id' | 'code'> & {
  pushWarning?: string;
};

type UnlockState = 'idle' | 'creating' | 'pending' | 'approved' | 'rejected' | 'expired' | 'error';

export type WebSecureUnlockProps = {
  userId: string;
  onApproved?: () => void;
  secureDashboard?: ReactNode;
};

export function SecureDashboard() {
  return null;
}

export function WebSecureUnlock({
  userId,
  onApproved,
  secureDashboard,
}: WebSecureUnlockProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const [state, setState] = useState<UnlockState>('idle');
  const [challenge, setChallenge] = useState<CreateChallengeResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const removeChallengeChannel = useCallback(() => {
    if (channelRef.current) {
      void supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
  }, []);

  useEffect(() => removeChallengeChannel, [removeChallengeChannel]);

  const handleStatusChange = useCallback(
    (payload: RealtimePostgresChangesPayload<AuthChallenge>) => {
      const nextStatus = (payload.new as AuthChallenge).status;

      if (nextStatus === 'approved') {
        setState('approved');
        removeChallengeChannel();
        onApproved?.();
        return;
      }

      if (nextStatus === 'rejected' || nextStatus === 'expired') {
        setState(nextStatus);
        removeChallengeChannel();
      }
    },
    [onApproved, removeChallengeChannel]
  );

  const subscribeToChallenge = useCallback(
    (challengeId: string) => {
      removeChallengeChannel();

      channelRef.current = supabase
        .channel(`auth_challenge_${challengeId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'auth_challenges',
            filter: `id=eq.${challengeId}`,
          },
          handleStatusChange
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            setState('error');
            setErrorMessage('Realtime verification channel failed. Try again.');
          }
        });
    },
    [handleStatusChange, removeChallengeChannel]
  );

  const createChallenge = useCallback(async () => {
    if (!userId || state === 'creating' || state === 'pending') return;

    setState('creating');
    setErrorMessage(null);
    setChallenge(null);
    removeChallengeChannel();

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error('Sign in again before starting verification.');
      }

      const response = await fetch('/api/create-challenge', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorBody = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorBody?.error ?? `Challenge request failed with ${response.status}`);
      }

      const metadata = (await response.json()) as CreateChallengeResponse;
      if (!metadata.id || !/^\d{2}$/.test(metadata.code)) {
        throw new Error('Challenge response was missing a valid id or 2-digit code.');
      }

      setChallenge(metadata);
      if (metadata.pushWarning) {
        setErrorMessage(metadata.pushWarning);
      }
      setState('pending');
      subscribeToChallenge(metadata.id);
    } catch (error) {
      setState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Could not create challenge.');
    }
  }, [removeChallengeChannel, state, subscribeToChallenge, userId]);

  if (state === 'approved') {
    return <>{secureDashboard ?? <SecureDashboard />}</>;
  }

  const isBusy = state === 'creating';
  const isPending = state === 'pending';
  const statusText =
    state === 'rejected'
      ? 'Verification was rejected on your phone.'
      : state === 'expired'
        ? 'Verification expired. Start a new challenge.'
        : state === 'error'
          ? errorMessage ?? 'Verification could not be started.'
          : isPending
            ? errorMessage
              ? `Approve in the DIBS mobile app. Push warning: ${errorMessage}`
              : 'Approve this request from the DIBS mobile app.'
            : 'Use your enrolled phone to unlock this secure section.';

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colorScheme === 'dark' ? '#11141C' : theme.surface,
          borderColor: theme.cardTintBorder,
        },
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: theme.cardTint }]}>
        <MaterialIcons name="phonelink-lock" size={30} color={theme.accent} />
      </View>

      <ThemedText style={[styles.title, { color: theme.text }]}>Unlock Secure Section</ThemedText>
      <ThemedText style={[styles.subtitle, { color: theme.mutedText }]}>{statusText}</ThemedText>

      {challenge ? (
        <View style={[styles.codePanel, { backgroundColor: theme.cardTint, borderColor: theme.cardTintBorder }]}>
          <ThemedText style={[styles.codeLabel, { color: theme.mutedText }]}>Verification code</ThemedText>
          <ThemedText style={[styles.codeValue, { color: theme.text }]}>{challenge.code}</ThemedText>
        </View>
      ) : null}

      <Pressable
        onPress={createChallenge}
        disabled={isBusy || isPending}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: theme.primary, opacity: pressed || isBusy || isPending ? 0.76 : 1 },
        ]}>
        {isBusy ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <>
            <MaterialIcons name={isPending ? 'hourglass-top' : 'lock-open'} size={20} color="#FFFFFF" />
            <ThemedText style={styles.buttonText}>
              {isPending ? 'Waiting for Approval' : 'Unlock Secure Section'}
            </ThemedText>
          </>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 420,
    maxWidth: '100%' as unknown as number,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
  },
  iconWrap: {
    width: 58,
    height: 58,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
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
    lineHeight: 21,
    textAlign: 'center',
    marginBottom: 22,
  },
  codePanel: {
    alignSelf: 'stretch',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    marginBottom: 22,
  },
  codeLabel: {
    fontFamily: FontFamilies.medium,
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  codeValue: {
    fontFamily: FontFamilies.bold,
    fontSize: 54,
    lineHeight: 62,
  },
  button: {
    minWidth: 244,
    height: 48,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontFamily: FontFamilies.semiBold,
    fontSize: 14,
  },
});
