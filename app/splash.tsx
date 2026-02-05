import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

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
            <LottieView
              source={require('../assets/lottie/pulse_ring.json')}
              autoPlay
              loop
              style={styles.pulseLottie}
            />
            <View style={[styles.logoWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <MaterialIcons name="shield" size={38} color={theme.primary} />
            </View>
          </View>
          <ThemedText type="title" style={styles.title}>
            DIBS
          </ThemedText>
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
    width: 110,
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  pulseLottie: {
    position: 'absolute',
    width: 110,
    height: 110,
  },
  logoWrap: {
    width: 76,
    height: 76,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  title: {
    marginBottom: 6,
  },
});
