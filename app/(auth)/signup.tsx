import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, FontFamilies } from '@/constants/theme';
import { useDemoSession } from '@/hooks/demo-session';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SurfaceCard } from '@/components/ui/surface-card';

export default function SignupScreen() {
  const router = useRouter();
  const { signIn } = useDemoSession();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const enableLayoutAnimations = process.env.EXPO_OS !== 'web';

  const [fullName, setFullName] = useState('John Doe');
  const [email, setEmail] = useState('john.doe@example.com');
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('6282179410083');
  const [password, setPassword] = useState('password');

  const inputBg = useMemo(
    () => (colorScheme === 'dark' ? theme.surface : theme.surface),
    [colorScheme, theme.surface]
  );

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={
              colorScheme === 'dark'
                ? ['rgba(106, 168, 255, 0.18)', 'rgba(7, 10, 18, 0)']
                : ['rgba(106, 168, 255, 0.14)', 'rgba(246, 247, 251, 0)']
            }
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={styles.topGlow}
          />
          <LinearGradient
            colors={
              colorScheme === 'dark'
                ? ['rgba(34, 198, 217, 0.10)', 'rgba(7, 10, 18, 0)']
                : ['rgba(34, 198, 217, 0.12)', 'rgba(246, 247, 251, 0)']
            }
            start={{ x: 0.9, y: 0 }}
            end={{ x: 0.1, y: 1 }}
            style={styles.cornerGlow}
          />
        </View>
        <Animated.View
          style={styles.header}
          {...(enableLayoutAnimations ? { entering: FadeInDown.duration(260) } : {})}>
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backButton,
                { backgroundColor: theme.surface2, borderColor: theme.border, opacity: pressed ? 0.78 : 1 },
              ]}>
              <MaterialIcons name="chevron-left" size={22} color={theme.icon} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <ThemedText type="title" style={{ marginBottom: 6 }}>
                Create Account
              </ThemedText>
              <ThemedText style={{ color: theme.mutedText, fontFamily: FontFamilies.medium }}>
                Join us and keep your content protected.
              </ThemedText>
            </View>
          </View>
        </Animated.View>

        <Animated.View
          style={styles.card}
          {...(enableLayoutAnimations ? { entering: FadeInUp.duration(260) } : {})}>
          <SurfaceCard style={styles.formCard}>
            <Field
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              theme={theme}
              inputBg={inputBg}
              textContentType="name"
            />
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

            <ThemedText style={{ color: theme.mutedText, fontFamily: FontFamilies.semiBold, marginBottom: 6 }}>
              Phone Number
            </ThemedText>
            <View style={[styles.phoneInputWrap, { backgroundColor: inputBg, borderColor: theme.border }]}>
              <Pressable
                onPress={() => setCountryCode((current) => (current === '+1' ? '+62' : '+1'))}
                style={({ pressed }) => [
                  styles.phonePrefix,
                  {
                    backgroundColor: theme.surface2,
                    borderColor: theme.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}>
                <ThemedText style={{ fontFamily: FontFamilies.semiBold }}>{countryCode}</ThemedText>
                <MaterialIcons name="expand-more" size={18} color={theme.icon} />
              </Pressable>
              <TextInput
                placeholder="Phone Number"
                placeholderTextColor={theme.icon}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                style={[styles.phoneInput, { color: theme.text }]}
              />
            </View>

            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              theme={theme}
              inputBg={inputBg}
              secureTextEntry
              textContentType="newPassword"
            />

            <Pressable
              onPress={() => {
                signIn();
                router.replace('/(tabs)');
              }}
              style={({ pressed }) => [styles.primaryButton, { opacity: pressed ? 0.92 : 1, backgroundColor: theme.primary }]}>
              <ThemedText style={{ color: '#FFFFFF', fontFamily: FontFamilies.semiBold }}>
                Create Account
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={() => router.replace('/(auth)/login')}
              style={({ pressed }) => [styles.linkRow, { opacity: pressed ? 0.7 : 1 }]}>
              <ThemedText style={{ color: theme.mutedText, fontFamily: FontFamilies.medium }}>
                Already have an account?
              </ThemedText>
            <ThemedText style={{ color: theme.accent, fontFamily: FontFamilies.semiBold }}>
                Login
              </ThemedText>
            </Pressable>
          </SurfaceCard>
        </Animated.View>
      </SafeAreaView>
    </ThemedView>
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
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  linkRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
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
    minWidth: 62,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    flexDirection: 'row',
    gap: 4,
  },
  phoneInput: {
    flex: 1,
    fontSize: 14,
    marginLeft: 10,
    fontFamily: FontFamilies.medium,
  },
});
