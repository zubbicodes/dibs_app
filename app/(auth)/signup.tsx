import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DibsLogo } from '@/components/dibs-logo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, FontFamilies } from '@/constants/theme';
import { useDemoSession } from '@/hooks/demo-session';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function SignupScreen() {
  const router = useRouter();
  const { signIn } = useDemoSession();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const enableLayoutAnimations = process.env.EXPO_OS !== 'web';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const inputBg = useMemo(
    () => (colorScheme === 'dark' ? theme.surface : theme.surface),
    [colorScheme, theme.surface]
  );

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <Animated.View
          style={styles.header}
          {...(enableLayoutAnimations ? { entering: FadeInDown.duration(260) } : {})}>
          <View style={styles.logoContainer}>
            <DibsLogo width={140} height={52} />
          </View>
          <ThemedText type="title" style={styles.headerTitle}>
            Create account
          </ThemedText>
          <ThemedText style={[styles.subTitle, { color: theme.mutedText }]}>
            Use your email to get started
          </ThemedText>
        </Animated.View>

        <Animated.View
          style={styles.form}
          {...(enableLayoutAnimations ? { entering: FadeInUp.duration(260) } : {})}>
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
            textContentType="newPassword"
          />

          <Pressable
            onPress={() => {
              signIn();
              router.replace('/(tabs)');
            }}
            style={({ pressed }) => [styles.primaryButton, { opacity: pressed ? 0.92 : 1, backgroundColor: theme.primary }]}>
            <ThemedText style={{ color: '#FFFFFF', fontFamily: FontFamilies.semiBold }}>
              Create account
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={() => router.replace('/(auth)/login')}
            style={({ pressed }) => [styles.linkRow, { opacity: pressed ? 0.7 : 1 }]}>
            <ThemedText style={{ color: theme.mutedText, fontFamily: FontFamilies.medium }}>
              Already have an account?
            </ThemedText>
            <ThemedText style={{ color: theme.accent, fontFamily: FontFamilies.semiBold }}>
              Sign in
            </ThemedText>
          </Pressable>
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
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 18,
  },
  header: {
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    lineHeight: 34,
  },
  subTitle: {
    fontFamily: FontFamilies.medium,
  },
  input: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: FontFamilies.medium,
  },
  primaryButton: {
    marginTop: 8,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  form: {
    flex: 1,
    justifyContent: 'flex-start',
    gap: 14,
    paddingTop: 6,
  },
});
