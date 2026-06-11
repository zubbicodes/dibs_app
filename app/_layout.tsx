import { ErrorBoundary } from '@/components/error-boundary';
import { Colors } from '@/constants/theme';
import { DemoSessionProvider } from '@/hooks/demo-session';
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { ThemeModeProvider, useColorScheme } from '@/hooks/use-color-scheme';
import { FaceModelProvider } from '@/hooks/use-face-model';
import { PhoneDetectionProvider } from '@/hooks/use-phone-detector';
import { ScreenshotProtectionProvider } from '@/hooks/use-screenshot-protection';
import { WatermarkProvider } from '@/hooks/use-watermark';
import {
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    useFonts,
} from '@expo-google-fonts/poppins';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

export const unstable_settings = {
  anchor: 'splash',
  initialRouteName: 'splash',
};

void SplashScreen.preventAutoHideAsync();

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
              <ScreenshotProtectionProvider>
                <PhoneDetectionProvider>
                  <WatermarkProvider>
                    <RootNavigator />
                  </WatermarkProvider>
                </PhoneDetectionProvider>
              </ScreenshotProtectionProvider>
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
        <View style={[styles.webRoot, { backgroundColor: Colors[colorScheme].background }]}>
          <AppStack />
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </View>
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

const styles = StyleSheet.create({
  webRoot: {
    flex: 1,
    minHeight: '100vh' as unknown as number,
    width: '100%' as unknown as number,
  },
});
