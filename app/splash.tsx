import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { DibsLogo } from '@/components/dibs-logo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, FontFamilies } from '@/constants/theme';
import { useDemoSession } from '@/hooks/demo-session';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SurfaceCard } from '@/components/ui/surface-card';

export default function SplashScreen() {
  const router = useRouter();
  const { isSignedIn } = useDemoSession();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace(isSignedIn ? '/(tabs)' : '/(auth)/login');
    }, 900);
    return () => clearTimeout(timer);
  }, [isSignedIn, router]);

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={
              colorScheme === 'dark'
                ? ['rgba(34, 198, 217, 0.18)', 'rgba(7, 10, 18, 0)']
                : ['rgba(34, 198, 217, 0.16)', 'rgba(246, 247, 251, 0)']
            }
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={styles.topGlow}
          />
        </View>

        <SurfaceCard variant="glass" style={styles.splashCard}>
          <View style={styles.logoStack}>
            <DibsLogo width={200} height={80} />
          </View>
          <ThemedText style={{ color: theme.mutedText, fontFamily: FontFamilies.semiBold, textAlign: 'center' }}>
            DIGITAL IMAGE BIOMETRIC SYSTEMS
          </ThemedText>
        </SurfaceCard>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  safeArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  topGlow: {
    position: 'absolute',
    left: -40,
    right: -40,
    top: -70,
    height: 320,
  },
  splashCard: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    paddingVertical: 16,
  },
  logoStack: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
});
