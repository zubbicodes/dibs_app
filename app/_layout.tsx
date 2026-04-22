import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';
import { ErrorBoundary } from '@/components/error-boundary';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, FontFamilies } from '@/constants/theme';
import { MOBILE_VIEWPORT, WebViewportContext, useViewportDimensions } from '@/hooks/use-viewport-dimensions';
import { ThemeModeProvider, useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { DemoSessionProvider } from '@/hooks/demo-session';
import { FaceModelProvider } from '@/hooks/use-face-model';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/poppins';

export const unstable_settings = {
  anchor: 'splash',
  initialRouteName: 'splash',
};

void SplashScreen.preventAutoHideAsync();

const WEB_SCREENS = [
  { label: 'Splash', path: '/splash' },
  { label: 'Login', path: '/(auth)/login' },
  { label: 'Signup', path: '/(auth)/signup' },
  { label: 'Face Enroll', path: '/(auth)/face-enroll' },
  { label: 'Home', path: '/(tabs)' },
  { label: 'Vault', path: '/(tabs)/vault' },
  { label: 'Logs', path: '/(tabs)/logs' },
  { label: 'Settings', path: '/(tabs)/settings' },
  { label: 'Verification Modal', path: '/modal' },
];

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <ThemeModeProvider>
        <DemoSessionProvider>
          <AuthProvider>
            <FaceModelProvider>
              <RootNavigator />
            </FaceModelProvider>
          </AuthProvider>
        </DemoSessionProvider>
      </ThemeModeProvider>
    </ErrorBoundary>
  );
}

function RootNavigator() {
  const colorScheme = useColorScheme() ?? 'light';
  const isWeb = Platform.OS === 'web';
  const { isLoading: isAuthLoading } = useAuth();

  // Keep the native splash visible until auth has resolved — prevents the
  // brief flash of (tabs) or another default route before the Stack settles
  // on the splash screen.
  useEffect(() => {
    if (!isAuthLoading) {
      void SplashScreen.hideAsync();
    }
  }, [isAuthLoading]);

  if (isAuthLoading) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {isWeb ? (
        <WebShell colorScheme={colorScheme}>
          <AppStack />
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </WebShell>
      ) : (
        <>
          <AppStack />
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </>
      )}
    </ThemeProvider>
  );
}

function AppStack() {
  return (
    <Stack
      initialRouteName="splash"
      screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 220 }}>
      <Stack.Screen name="splash" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="notifications"
        options={{
          presentation: 'modal',
          headerShown: false,
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="modal"
        options={{
          presentation: 'modal',
          headerShown: false,
          title: 'Identity Verification',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="viewer"
        options={{
          presentation: 'modal',
          headerShown: false,
          animation: 'fade',
        }}
      />
    </Stack>
  );
}

const PHONE_BEZEL = 12;
const PHONE_FRAME_W = MOBILE_VIEWPORT.width + PHONE_BEZEL * 2;
const PHONE_FRAME_H = MOBILE_VIEWPORT.height + PHONE_BEZEL * 2;

function WebShell({ children, colorScheme }: { children: ReactNode; colorScheme: 'light' | 'dark' }) {
  const router = useRouter();
  const pathname = usePathname();
  const { width: windowWidth } = useViewportDimensions();
  const theme = Colors[colorScheme];
  const isCompact = windowWidth < 980;
  const showBackButton = pathname !== '/splash' && pathname !== '/';

  return (
    <ThemedView style={[styles.webRoot, { backgroundColor: colorScheme === 'dark' ? '#050810' : '#0D1320' }]}>
      <View style={[styles.webBody, isCompact ? styles.webBodyCompact : null]}>
        <View style={styles.phoneCenter}>
          <View style={styles.phoneWrap}>
            {showBackButton ? (
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => [
                  styles.phoneBackButtonOuter,
                  isCompact ? styles.phoneBackButtonCompact : null,
                  {
                    borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(10, 16, 28, 0.12)',
                    backgroundColor: colorScheme === 'dark' ? 'rgba(12, 18, 32, 0.62)' : 'rgba(255, 255, 255, 0.85)',
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}>
                <MaterialIcons name="arrow-back" size={18} color={theme.text} />
              </Pressable>
            ) : null}
            <View
              style={[
                styles.phoneFrame,
                {
                  width: PHONE_FRAME_W,
                  height: PHONE_FRAME_H,
                  borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.14)' : 'rgba(10, 16, 28, 0.2)',
                  backgroundColor: colorScheme === 'dark' ? '#040710' : '#0A0F1B',
                },
              ]}>
              <View style={[styles.phoneScreen, { borderColor: theme.border }]}>
                <WebViewportContext.Provider value={MOBILE_VIEWPORT}>
                  <View style={styles.phoneViewport}>{children}</View>
                </WebViewportContext.Provider>
              </View>
            </View>
          </View>
        </View>
        <View style={[styles.screenList, isCompact ? styles.screenListCompact : null]}>
          <ThemedText type="title" style={styles.listTitle}>
            Demo Screens
          </ThemedText>
          <ThemedText style={[styles.listSubtitle, { color: theme.mutedText }]}>
            Tap any screen to preview it
          </ThemedText>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            style={styles.listScroll}>
            {WEB_SCREENS.map((screen) => (
              <Pressable
                key={screen.path}
                onPress={() => router.push(screen.path as never)}
                style={({ pressed }) => [
                  styles.listItem,
                  {
                    borderColor: theme.border,
                    backgroundColor: colorScheme === 'dark' ? 'rgba(12, 18, 32, 0.6)' : 'rgba(255, 255, 255, 0.92)',
                    opacity: pressed ? 0.84 : 1,
                  },
                ]}>
                <ThemedText style={[styles.listLabel, { color: theme.text }]}>{screen.label}</ThemedText>
                <ThemedText style={[styles.listPath, { color: theme.mutedText }]}>{screen.path}</ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  webRoot: {
    flex: 1,
    minHeight: '100vh' as unknown as number,
    overflow: 'visible',
  },
  webBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 24,
    gap: 28,
    overflow: 'visible',
    minHeight: '100vh' as unknown as number,
  },
  webBodyCompact: {
    flexDirection: 'column',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  phoneCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    minWidth: 0,
    minHeight: 0,
    overflow: 'visible',
  },
  phoneWrap: {
    width: PHONE_FRAME_W,
    height: PHONE_FRAME_H,
    position: 'relative' as const,
    overflow: 'visible',
  },
  phoneBackButtonCompact: {
    left: 8,
    top: 24,
  },
  phoneFrame: {
    borderRadius: 48,
    borderWidth: 1,
    padding: PHONE_BEZEL,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12,
    minWidth: 0,
    minHeight: 0,
  },
  phoneBackButtonOuter: {
    position: 'absolute' as const,
    left: -56,
    top: 24,
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 10,
  },
  phoneScreen: {
    width: MOBILE_VIEWPORT.width,
    height: MOBILE_VIEWPORT.height,
    borderRadius: 36,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  phoneViewport: {
    width: MOBILE_VIEWPORT.width,
    height: MOBILE_VIEWPORT.height,
    overflow: 'hidden',
  },
  screenList: {
    width: 300,
    maxHeight: 760,
  },
  screenListCompact: {
    width: '100%',
    maxHeight: 320,
  },
  listTitle: {
    fontSize: 26,
  },
  listSubtitle: {
    marginTop: 4,
    fontSize: 14,
    fontFamily: FontFamilies.medium,
  },
  listScroll: {
    marginTop: 16,
  },
  listContainer: {
    gap: 12,
    paddingBottom: 12,
  },
  listItem: {
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  listLabel: {
    fontFamily: FontFamilies.semiBold,
    fontSize: 15,
  },
  listPath: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: FontFamilies.medium,
  },
});
