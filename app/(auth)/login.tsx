import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Colors, FontFamilies } from '@/constants/theme';
import { useDemoSession } from '@/hooks/demo-session';
import { useColorScheme } from '@/hooks/use-color-scheme';

type LoginMode = 'phone' | 'email';
type LoginStep = 'enter' | 'otp';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useDemoSession();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const enableLayoutAnimations = process.env.EXPO_OS !== 'web';

  const [mode, setMode] = useState<LoginMode>('phone');
  const [step, setStep] = useState<LoginStep>('enter');
  const [email, setEmail] = useState('john.doe@example.com');
  const [password, setPassword] = useState('password');
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('6282179410083');
  const [otp, setOtp] = useState('');
  const otpInputRef = useRef<TextInput>(null);

  const inputBg = useMemo(
    () => (colorScheme === 'dark' ? theme.surface : theme.surface),
    [colorScheme, theme.surface]
  );

  useEffect(() => {
    if (step !== 'otp') return;
    const t = setTimeout(() => otpInputRef.current?.focus(), 250);
    return () => clearTimeout(t);
  }, [step]);

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
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
          <LinearGradient
            colors={
              colorScheme === 'dark'
                ? ['rgba(106, 168, 255, 0.08)', 'rgba(7, 10, 18, 0)']
                : ['rgba(106, 168, 255, 0.10)', 'rgba(246, 247, 251, 0)']
            }
            start={{ x: 0.9, y: 0 }}
            end={{ x: 0.1, y: 1 }}
            style={styles.cornerGlow}
          />
        </View>
        <View style={styles.content}>
          {step === 'enter' ? (
            <>
            <Animated.View
              style={styles.header}
              {...(enableLayoutAnimations ? { entering: FadeInDown.duration(240) } : {})}>
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <ThemedText type="title" style={styles.headerTitle}>
                    Login Account
                  </ThemedText>
                  <ThemedText style={{ color: theme.mutedText, fontFamily: FontFamilies.medium }}>
                    Hello, welcome back to our account
                  </ThemedText>
                </View>
                <Pressable
                  onPress={() => setCountryCode((current) => (current === '+1' ? '+62' : '+1'))}
                  style={({ pressed }) => [
                    styles.countryButton,
                    {
                      backgroundColor: theme.surface2,
                      borderColor: theme.border,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}>
                  <MaterialIcons name="flag" size={16} color={theme.icon} />
                  <ThemedText style={{ fontFamily: FontFamilies.semiBold }}>{countryCode}</ThemedText>
                  <MaterialIcons name="expand-more" size={18} color={theme.icon} />
                </Pressable>
              </View>
            </Animated.View>

            <Animated.View
              style={styles.card}
              {...(enableLayoutAnimations ? { entering: FadeInUp.duration(240).delay(40) } : {})}>
              <SurfaceCard style={styles.formCard}>
                <View style={[styles.segmentWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <SegmentButton
                    label="Email"
                    selected={mode === 'email'}
                    onPress={() => setMode('email')}
                    theme={theme}
                  />
                  <SegmentButton
                    label="Phone Number"
                    selected={mode === 'phone'}
                    onPress={() => setMode('phone')}
                    theme={theme}
                  />
                </View>

                {mode === 'phone' ? (
                  <>
                    <ThemedText style={fieldLabel(theme)}>Phone Number</ThemedText>
                    <View style={[styles.phoneInputWrap, { backgroundColor: inputBg, borderColor: theme.border }]}>
                      <View style={[styles.phonePrefix, { backgroundColor: theme.surface2, borderColor: theme.border }]}>
                        <ThemedText style={{ fontFamily: FontFamilies.semiBold }}>{countryCode}</ThemedText>
                      </View>
                      <TextInput
                        placeholder="Phone Number"
                        placeholderTextColor={theme.icon}
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                        style={[styles.phoneInput, { color: theme.text }]}
                      />
                      <View style={styles.phoneStatus}>
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: phoneNumber.trim().length >= 8 ? theme.success : theme.border },
                          ]}
                        />
                      </View>
                    </View>

                    <Pressable
                      onPress={() => {
                        setOtp('');
                        setStep('otp');
                      }}
                      style={({ pressed }) => [
                        styles.primaryButton,
                        { opacity: pressed ? 0.92 : 1, backgroundColor: theme.primary },
                      ]}>
                      <ThemedText style={{ color: '#FFFFFF', fontFamily: FontFamilies.semiBold }}>
                        Request OTP
                      </ThemedText>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Field
                      label="Email"
                      value={email}
                      onChangeText={setEmail}
                      theme={theme}
                      inputBg={inputBg}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      textContentType="emailAddress"
                    />
                    <Field
                      label="Password"
                      value={password}
                      onChangeText={setPassword}
                      theme={theme}
                      inputBg={inputBg}
                      secureTextEntry
                      textContentType="password"
                    />
                    <Pressable
                      onPress={() => {
                        signIn();
                        router.replace('/(tabs)');
                      }}
                      style={({ pressed }) => [styles.primaryButton, { opacity: pressed ? 0.92 : 1, backgroundColor: theme.primary }]}>
                      <ThemedText style={{ color: '#FFFFFF', fontFamily: FontFamilies.semiBold }}>
                        Login
                      </ThemedText>
                    </Pressable>
                  </>
                )}

                <View style={styles.dividerRow}>
                  <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                  <ThemedText style={{ color: theme.mutedText, fontSize: 11 }}>
                    or Sign in with Google
                  </ThemedText>
                  <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
                </View>

                <Pressable
                  onPress={() => {
                    signIn();
                    router.replace('/(tabs)');
                  }}
                  style={({ pressed }) => [
                    styles.secondaryButton,
                    { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.92 : 1 },
                  ]}>
                  <View style={[styles.googleBadge, { backgroundColor: theme.surface2, borderColor: theme.border }]}>
                    <ThemedText style={{ fontFamily: FontFamilies.semiBold, color: theme.primary }}>G</ThemedText>
                  </View>
                  <ThemedText style={{ fontFamily: FontFamilies.semiBold }}>Google</ThemedText>
                </Pressable>

                <Pressable
                  onPress={() => router.push('/(auth)/signup')}
                  style={({ pressed }) => [styles.linkRow, { opacity: pressed ? 0.7 : 1 }]}>
                  <ThemedText style={{ color: theme.mutedText, fontFamily: FontFamilies.medium }}>
                    Not registered yet?
                  </ThemedText>
                  <ThemedText style={{ color: theme.accent, fontFamily: FontFamilies.semiBold }}>
                    Create an Account
                  </ThemedText>
                </Pressable>
              </SurfaceCard>
            </Animated.View>
            </>
          ) : (
            <Animated.View
              style={styles.otpWrap}
              {...(enableLayoutAnimations ? { entering: FadeInUp.duration(240) } : {})}>
            <View style={styles.otpHeader}>
              <Pressable
                onPress={() => setStep('enter')}
                style={({ pressed }) => [
                  styles.backButton,
                  { backgroundColor: theme.surface2, borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
                ]}>
                <MaterialIcons name="chevron-left" size={22} color={theme.icon} />
              </Pressable>
              <ThemedText style={{ fontFamily: FontFamilies.semiBold }}>OTP</ThemedText>
              <View style={{ width: 42 }} />
            </View>

            <SurfaceCard style={styles.otpCard}>
              <View style={styles.otpIllustration}>
                <View style={[styles.otpCircle, { backgroundColor: theme.surface }]} />
                <View style={[styles.otpCircleSmall, { backgroundColor: theme.accent }]} />
                <View style={[styles.otpCircleSmall2, { backgroundColor: theme.primary }]} />
                <MaterialIcons name="mark-email-unread" size={56} color={theme.primary} />
              </View>

              <ThemedText type="title" style={{ textAlign: 'center', marginBottom: 8 }}>
                Verification code
              </ThemedText>
              <ThemedText style={{ color: theme.mutedText, textAlign: 'center', marginBottom: 10 }}>
                We have sent the code verification to{'\n'}Your Mobile Number
              </ThemedText>

              <View style={styles.otpNumberRow}>
                <ThemedText style={{ fontFamily: FontFamilies.semiBold }}>{countryCode + phoneNumber}</ThemedText>
                <Pressable
                  onPress={() => setStep('enter')}
                  style={({ pressed }) => [
                    styles.editPill,
                    { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
                  ]}>
                  <MaterialIcons name="edit" size={16} color={theme.icon} />
                </Pressable>
              </View>

              <Pressable
                onPress={() => otpInputRef.current?.focus()}
                style={styles.otpDigitsRow}>
                {Array.from({ length: 4 }).map((_, index) => (
                  <View key={index} style={[styles.otpDigit, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <ThemedText style={{ fontFamily: FontFamilies.semiBold, fontSize: 16 }}>
                      {otp[index] ?? ''}
                    </ThemedText>
                  </View>
                ))}
                <TextInput
                  ref={otpInputRef}
                  value={otp}
                  onChangeText={(value) => setOtp(value.replace(/\D/g, '').slice(0, 4))}
                  keyboardType="number-pad"
                  maxLength={4}
                  style={styles.otpHiddenInput}
                  autoFocus
                />
              </Pressable>

              <Pressable
                onPress={() => {
                  if (otp.trim().length < 4) return;
                  signIn();
                  router.replace('/(tabs)');
                }}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { opacity: pressed ? 0.92 : 1, backgroundColor: theme.primary },
                ]}>
                <ThemedText style={{ color: '#FFFFFF', fontFamily: FontFamilies.semiBold }}>
                  Submit
                </ThemedText>
              </Pressable>
            </SurfaceCard>
            </Animated.View>
          )}

        <Animated.View
          style={styles.footer}
          {...(enableLayoutAnimations ? { entering: FadeInUp.duration(280).delay(80) } : {})}>
          <ThemedText style={{ color: theme.mutedText, textAlign: 'center' }}>
            Demo build · Authentication is simulated
          </ThemedText>
        </Animated.View>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

function SegmentButton({
  label,
  selected,
  onPress,
  theme,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  theme: typeof Colors.light;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.segmentButton,
        {
          backgroundColor: selected ? theme.surface2 : 'transparent',
          borderColor: selected ? theme.border : 'transparent',
          opacity: pressed ? 0.86 : 1,
        },
      ]}>
      <ThemedText style={{ fontFamily: FontFamilies.semiBold, color: selected ? theme.text : theme.mutedText }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function Field({
  label,
  theme,
  inputBg,
  ...props
}: {
  label: string;
  theme: typeof Colors.light;
  inputBg: string;
} & ComponentProps<typeof TextInput>) {
  return (
    <View style={{ marginBottom: 12 }}>
      <ThemedText style={{ color: theme.mutedText, fontFamily: FontFamilies.semiBold, marginBottom: 6 }}>
        {label}
      </ThemedText>
      <TextInput
        placeholder={label}
        placeholderTextColor={theme.icon}
        style={[
          styles.input,
          {
            backgroundColor: inputBg,
            borderColor: theme.border,
            color: theme.text,
          },
        ]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  content: {
    flex: 1,
  },
  topGlow: {
    position: 'absolute',
    left: -40,
    right: -40,
    top: -70,
    height: 320,
  },
  cornerGlow: {
    position: 'absolute',
    right: -60,
    top: 40,
    width: 240,
    height: 240,
  },
  header: {
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    marginBottom: 4,
  },
  countryButton: {
    height: 34,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  card: {
    flex: 1,
  },
  formCard: {
    padding: 14,
  },
  input: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: FontFamilies.medium,
  },
  primaryButton: {
    marginTop: 6,
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  secondaryButton: {
    height: 46,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  googleBadge: {
    width: 28,
    height: 28,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  footer: {
    marginTop: 'auto',
    justifyContent: 'flex-end',
    paddingBottom: 14,
  },
  segmentWrap: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 3,
    flexDirection: 'row',
    marginBottom: 12,
  },
  segmentButton: {
    flex: 1,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phoneInputWrap: {
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  phonePrefix: {
    height: 34,
    minWidth: 52,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  phoneInput: {
    flex: 1,
    fontSize: 14,
    marginLeft: 10,
    fontFamily: FontFamilies.medium,
  },
  phoneStatus: {
    width: 30,
    alignItems: 'flex-end',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
    marginBottom: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  otpWrap: {
    flex: 1,
  },
  otpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    marginBottom: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpCard: {
    padding: 16,
  },
  otpIllustration: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 140,
    marginBottom: 6,
  },
  otpCircle: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    opacity: 0.75,
  },
  otpCircleSmall: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    top: 20,
    right: 38,
    opacity: 0.9,
  },
  otpCircleSmall2: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
    bottom: 28,
    left: 44,
    opacity: 0.9,
  },
  otpNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 12,
  },
  editPill: {
    width: 30,
    height: 30,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpDigitsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  otpDigit: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpHiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
});

function fieldLabel(theme: typeof Colors.light) {
  return { color: theme.mutedText, fontFamily: FontFamilies.semiBold, marginBottom: 8 };
}
