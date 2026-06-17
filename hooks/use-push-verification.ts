import Constants from 'expo-constants';
import { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
import type { NotificationPermissionsStatus } from 'expo-notifications/build/NotificationPermissions.types';
import getExpoPushTokenAsync from 'expo-notifications/build/getExpoPushTokenAsync';
import {
  addNotificationResponseReceivedListener,
  getLastNotificationResponseAsync,
} from 'expo-notifications/build/NotificationsEmitter';
import {
  getPermissionsAsync,
  requestPermissionsAsync,
} from 'expo-notifications/build/NotificationPermissions';
import { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
import setNotificationChannelAsync from 'expo-notifications/build/setNotificationChannelAsync';
import { Href, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef } from 'react';
import { Platform } from 'react-native';

import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

type VerificationNotificationData = Record<string, unknown>;

type AuthChallenge = {
  id: string;
  user_id: string;
  code: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  created_at: string;
};

setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function getProjectId() {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId
  );
}

function hasNotificationPermission(permissions: NotificationPermissionsStatus) {
  const value = permissions as unknown as { granted?: boolean; status?: string };
  return value.granted === true || value.status === 'granted';
}

function parseVerificationData(data?: VerificationNotificationData) {
  if (!data) return null;

  if (typeof data.challengeId !== 'string' || typeof data.code !== 'string') {
    return null;
  }

  if (!/^\d{2}$/.test(data.code)) {
    return null;
  }

  return {
    challengeId: data.challengeId,
    code: data.code,
  };
}

export function usePushVerification() {
  const router = useRouter();
  const { user } = useAuth();
  const lastOpenedChallengeRef = useRef<string | null>(null);

  const openVerification = useCallback(
    (data?: VerificationNotificationData) => {
      const parsed = parseVerificationData(data);
      if (!parsed) return;
      if (lastOpenedChallengeRef.current === parsed.challengeId) return;

      lastOpenedChallengeRef.current = parsed.challengeId;

      router.push({
        pathname: '/push-verification',
        params: parsed,
      } as unknown as Href);
    },
    [router]
  );

  useEffect(() => {
    if (Platform.OS === 'web' || !user?.id) return;

    const openChallenge = (challenge: AuthChallenge) => {
      if (challenge.status !== 'pending') return;
      openVerification({
        challengeId: challenge.id,
        code: challenge.code,
      });
    };

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    void supabase
      .from('auth_challenges')
      .select('id, user_id, code, status, created_at')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .gte('created_at', fiveMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data) {
          openChallenge(data as AuthChallenge);
        }
      });

    const channel = supabase
      .channel(`native_auth_challenges_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'auth_challenges',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          openChallenge(payload.new as AuthChallenge);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [openVerification, user?.id]);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const responseSubscription = addNotificationResponseReceivedListener((response) => {
      openVerification(response.notification.request.content.data);
    });

    getLastNotificationResponseAsync().then((response) => {
      if (response) {
        openVerification(response.notification.request.content.data);
      }
    });

    return () => {
      responseSubscription.remove();
    };
  }, [openVerification]);

  useEffect(() => {
    if (Platform.OS === 'web' || !user?.id) return;

    let cancelled = false;
    const userId = user.id;

    async function registerPushToken() {
      try {
        if (Platform.OS === 'android') {
          await setNotificationChannelAsync('default', {
            name: 'Default',
            importance: AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#22C6D9',
          });
        }

        const existingPermissions = await getPermissionsAsync();
        const finalPermissions =
          hasNotificationPermission(existingPermissions)
            ? existingPermissions
            : await requestPermissionsAsync();

        if (!hasNotificationPermission(finalPermissions)) return;

        const projectId = getProjectId();
        if (!projectId) {
          console.warn('[PushVerification] Missing EAS project id for Expo push token registration.');
          return;
        }

        const { data: token } = await getExpoPushTokenAsync({ projectId });
        if (cancelled || !token) return;

        const platform = Platform.OS === 'ios' ? 'ios' : 'android';
        const { error } = await supabase.from('push_tokens').upsert(
          {
            user_id: userId,
            token,
            platform,
          },
          { onConflict: 'token' }
        );

        if (error) {
          console.warn('[PushVerification] Failed to save Expo push token:', error.message);
        }
      } catch (error) {
        console.warn(
          '[PushVerification] Push registration skipped:',
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    void registerPushToken();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);
}
