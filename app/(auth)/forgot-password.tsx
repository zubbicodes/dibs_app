import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DibsLogo } from '@/components/dibs-logo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, FontFamilies } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useViewportDimensions } from '@/hooks/use-viewport-dimensions';
import { ResponsiveWrapper } from '@/components/responsive-wrapper';

type Stage = 'email' | 'otp';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { sendPasswordReset, verifyOtp } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { isMobile, isTablet } = useViewportDimensions();

  const [stage, setStage] = useState<Stage>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const inputBg = theme.inputBg;
  const placeholderColor = colorScheme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(15,26,43,0.4)';

  const validateEmail = (value: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value.trim());
  };

  const handleSendOtp = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    if (!validateEmail(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    const { error } = await sendPasswordReset(email.trim());
    setIsLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setStage('otp');
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }
    if (otp.trim().length < 8) {
      Alert.alert('Error', 'OTP must be 8 digits');
      return;
    }

    setIsLoading(true);
    const { error } = await verifyOtp(email.trim(), otp.trim());
    setIsLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      // OTP verified and user is now signed in.
      // Navigate to reset-password screen to let them set a new password.
      router.push('/(auth)/reset-password');
    }
  };

  const handleResendOtp = async () => {
    setIsLoading(true);
    const { error } = await sendPasswordReset(email.trim());
    setIsLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Sent', 'A new OTP has been sent to your email.');
    }
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ResponsiveWrapper maxWidth={isTablet ? 450 : 500} style={styles.content}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            <View style={styles.logoContainer}>
              <DibsLogo width={isMobile ? 200 : 240} height={isMobile ? 77 : 92} />
            </View>

            <View style={styles.form}>
              {stage === 'email' && (
                <>
                  <ThemedText
                    type="title"
                    style={[styles.headerTitle, { color: theme.text, fontSize: isMobile ? 24 : 32 }]}>
                    Forgot password?
                  </ThemedText>
                  <ThemedText
                    style={[styles.subTitle, { color: theme.mutedText, fontSize: isMobile ? 14 : 16 }]}>
                    Enter your email and we&apos;ll send you an 8-digit verification code.
                  </ThemedText>

                  <Field
                    label="Email address"
                    placeholder="e.g. wilson09@gmail.com"
                    value={email}
                    onChangeText={setEmail}
                    theme={theme}
                    inputBg={inputBg}
                    placeholderColor={placeholderColor}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    autoFocus
                  />

                  <Pressable
                    disabled={isLoading}
                    onPress={handleSendOtp}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      { backgroundColor: theme.primary, opacity: pressed || isLoading ? 0.8 : 1 },
                    ]}>
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <ThemedText style={styles.primaryButtonText}>Send verification code</ThemedText>
                    )}
                  </Pressable>
                </>
              )}

              {stage === 'otp' && (
                <>
                  <ThemedText
                    type="title"
                    style={[styles.headerTitle, { color: theme.text, fontSize: isMobile ? 24 : 32 }]}>
                    Enter verification code
                  </ThemedText>
                  <ThemedText
                    style={[styles.subTitle, { color: theme.mutedText, fontSize: isMobile ? 14 : 16 }]}>
                    We sent an 8-digit code to{' '}
                    <ThemedText style={{ color: theme.text, fontFamily: FontFamilies.medium }}>
                      {email}
                    </ThemedText>
                    . Enter it below to continue.
                  </ThemedText>

                  <Field
                    label="Verification code"
                    placeholder="00000000"
                    value={otp}
                    onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, ''))}
                    theme={theme}
                    inputBg={inputBg}
                    placeholderColor={placeholderColor}
                    keyboardType="number-pad"
                    maxLength={8}
                    autoFocus
                  />

                  <Pressable
                    disabled={isLoading}
                    onPress={handleVerifyOtp}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      { backgroundColor: theme.primary, opacity: pressed || isLoading ? 0.8 : 1 },
                    ]}>
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <ThemedText style={styles.primaryButtonText}>Verify</ThemedText>
                    )}
                  </Pressable>

                  <Pressable
                    onPress={handleResendOtp}
                    disabled={isLoading}
                    style={({ pressed }) => [styles.textLink, { opacity: pressed || isLoading ? 0.6 : 1 }]}>
                    <ThemedText style={[styles.textLinkLabel, { color: theme.accent }]}>
                      Resend code
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    onPress={() => setStage('email')}
                    style={({ pressed }) => [styles.textLink, { opacity: pressed ? 0.8 : 1 }]}>
                    <ThemedText style={[styles.textLinkLabel, { color: theme.mutedText }]}>
                      Use a different email
                    </ThemedText>
                  </Pressable>
                </>
              )}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              onPress={() => router.replace('/(auth)/login')}
              style={({ pressed }) => [styles.footerLink, { opacity: pressed ? 0.8 : 1 }]}>
              <ThemedText
                style={[styles.footerLinkText, { color: theme.mutedText, fontSize: isMobile ? 14 : 16 }]}>
                Remember your password?{' '}
                <ThemedText style={{ color: theme.accent, fontFamily: FontFamilies.medium }}>
                  Sign in
                </ThemedText>
              </ThemedText>
            </Pressable>
          </View>
        </ResponsiveWrapper>
      </SafeAreaView>
    </ThemedView>
  );
}

function Field({
  label,
  placeholder,
  theme,
  inputBg,
  placeholderColor,
  ...props
}: {
  label: string;
  placeholder?: string;
  theme: typeof Colors.light;
  inputBg: string;
  placeholderColor: string;
} & ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.fieldWrap}>
      <ThemedText style={[styles.fieldLabel, { color: theme.text }]}>{label}</ThemedText>
      <TextInput
        placeholder={placeholder ?? label}
        placeholderTextColor={placeholderColor}
        style={[
          styles.input,
          {
            backgroundColor: inputBg,
            borderColor: theme.inputBorder,
            color: theme.text,
          },
        ]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1, paddingHorizontal: 16 },
  content: { flex: 1 },
  scrollContent: { paddingTop: 24, paddingBottom: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  headerTitle: { fontFamily: FontFamilies.semiBold, lineHeight: 40, letterSpacing: -1, marginBottom: 4 },
  subTitle: { lineHeight: 22, opacity: 0.9, marginBottom: 24 },
  form: { gap: 14 },
  fieldWrap: { marginBottom: 4 },
  fieldLabel: { fontSize: 14, lineHeight: 22, marginBottom: 6 },
  input: {
    height: 54,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 20,
    fontSize: 14,
    fontFamily: FontFamilies.regular,
  },
  primaryButton: {
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontFamily: FontFamilies.semiBold },
  textLink: { alignSelf: 'center', marginTop: 16 },
  textLinkLabel: { fontSize: 14, fontFamily: FontFamilies.medium },
  footer: { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)', marginTop: 'auto' },
  footerLink: { paddingVertical: 16, alignItems: 'center' },
  footerLinkText: { fontFamily: FontFamilies.medium },
});
