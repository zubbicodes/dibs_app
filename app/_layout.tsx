import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, FontFamilies } from '@/constants/theme';
import { DemoSessionProvider } from '@/hooks/demo-session';
import { ThemeModeProvider, useColorScheme } from '@/hooks/use-color-scheme';
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
};

void SplashScreen.preventAutoHideAsync();

const WEB_SCREENS = [
  { label: 'Splash', path: '/splash' },
  { label: 'Login', path: '/(auth)/login' },
  { label: 'Signup', path: '/(auth)/signup' },
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

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeModeProvider>
      <DemoSessionProvider>
        <RootNavigator />
      </DemoSessionProvider>
    </ThemeModeProvider>
  );
}

function RootNavigator() {
  const colorScheme = useColorScheme() ?? 'light';
  const isWeb = Platform.OS === 'web';

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {isWeb ? (
        <WebShell colorScheme={colorScheme}>
          <Stack
            initialRouteName="splash"
            screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 220 }}>
            <Stack.Screen name="splash" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="modal"
              options={{
                presentation: 'modal',
                headerShown: false,
                title: 'Identity Verification',
                animation: 'slide_from_bottom',
              }}
            />
          </Stack>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </WebShell>
      ) : (
        <>
          <Stack
            initialRouteName="splash"
            screenOptions={{ headerShown: false, animation: 'fade', animationDuration: 220 }}>
            <Stack.Screen name="splash" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="modal"
              options={{
                presentation: 'modal',
                headerShown: false,
                title: 'Identity Verification',
                animation: 'slide_from_bottom',
              }}
            />
          </Stack>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </>
      )}
    </ThemeProvider>
  );
}

function WebShell({ children, colorScheme }: { children: ReactNode; colorScheme: 'light' | 'dark' }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const theme = Colors[colorScheme];
  const isCompact = width < 980;
  const canGoBack = typeof router.canGoBack === 'function' ? router.canGoBack() : true;

  return (
    <ThemedView style={styles.webRoot}>
      <View style={[styles.webBody, isCompact ? styles.webBodyCompact : null]}>
        <View style={[styles.webNotice, isCompact ? styles.webNoticeCompact : null]}>
          <View style={[styles.webNoticeCard, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <ThemedText type="subtitle">Web Preview Notice</ThemedText>
            <ThemedText style={[styles.webNoticeText, { color: theme.mutedText }]}>
              This web simulation may differ from the actual mobile experience. You can download the app for a better
              experience. APK download link will be added soon.
            </ThemedText>
          </View>
        </View>
        <View style={styles.phoneCenter}>
          <View style={styles.phoneWrap}>
            {canGoBack ? (
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => [
                  styles.phoneBackButtonOuter,
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
                  borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.14)' : 'rgba(10, 16, 28, 0.2)',
                  backgroundColor: colorScheme === 'dark' ? '#040710' : '#0A0F1B',
                },
              ]}>
              <View style={[styles.phoneScreen, { borderColor: theme.border }]}>
                <View style={styles.phoneViewport}>{children}</View>
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
  },
  webBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 24,
    gap: 28,
  },
  webBodyCompact: {
    flexDirection: 'column',
    paddingHorizontal: 20,
    paddingVertical: 18,
  },
  webNotice: {
    width: 260,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  webNoticeCompact: {
    width: '100%',
    alignItems: 'center',
  },
  webNoticeCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    width: '100%',
  },
  webNoticeText: {
    marginTop: 8,
    fontSize: 13,
    fontFamily: FontFamilies.medium,
    lineHeight: 18,
  },
  phoneCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    flexGrow: 1,
    minWidth: 0,
    minHeight: 0,
  },
  phoneWrap: {
    width: 380,
    height: 780,
    position: 'relative',
  },
  phoneFrame: {
    width: 380,
    height: 780,
    borderRadius: 52,
    borderWidth: 1,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 14 },
    elevation: 10,
    minWidth: 0,
    minHeight: 0,
  },
  phoneBackButtonOuter: {
    position: 'absolute',
    left: -60,
    top: 20,
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  phoneScreen: {
    flex: 1,
    borderRadius: 40,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    minWidth: 0,
    minHeight: 0,
  },
  phoneViewport: {
    flex: 1,
    paddingTop: 16,
    minWidth: 0,
    minHeight: 0,
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
