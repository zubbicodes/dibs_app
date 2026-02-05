import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, FontFamilies } from '@/constants/theme';
import { useDemoSession } from '@/hooks/demo-session';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function LoginScreen() {
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
        <View style={styles.content}>
          <Animated.View
            style={styles.header}
            {...(enableLayoutAnimations ? { entering: FadeInDown.duration(240) } : {})}>
            <ThemedText type="title" style={styles.headerTitle}>
              Welcome back
            </ThemedText>
            <ThemedText style={[styles.subTitle, { color: theme.mutedText }]}>
              Sign in with your email to continue
            </ThemedText>
          </Animated.View>

          <Animated.View
            style={styles.form}
            {...(enableLayoutAnimations ? { entering: FadeInUp.duration(240).delay(40) } : {})}>
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
              style={({ pressed }) => [
                styles.primaryButton,
                { opacity: pressed ? 0.92 : 1, backgroundColor: theme.primary },
              ]}>
              <ThemedText style={{ color: '#FFFFFF', fontFamily: FontFamilies.semiBold }}>
                Sign in
              </ThemedText>
            </Pressable>
          </Animated.View>

          <Animated.View
            style={styles.footer}
            {...(enableLayoutAnimations ? { entering: FadeInUp.duration(260).delay(80) } : {})}>
            <Pressable
              onPress={() => router.push('/(auth)/signup')}
              style={({ pressed }) => [styles.linkRow, { opacity: pressed ? 0.7 : 1 }]}>
              <ThemedText style={{ color: theme.mutedText, fontFamily: FontFamilies.medium }}>
                New here?
              </ThemedText>
              <ThemedText style={{ color: theme.accent, fontFamily: FontFamilies.semiBold }}>
                Create an account
              </ThemedText>
            </Pressable>
          </Animated.View>
        </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 28,
  },
  header: {
    gap: 8,
  },
  headerTitle: {
    fontSize: 28,
    lineHeight: 34,
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
  footer: {
    justifyContent: 'flex-end',
  },
  form: {
    gap: 14,
  },
  subTitle: {
    fontFamily: FontFamilies.medium,
  },
});
