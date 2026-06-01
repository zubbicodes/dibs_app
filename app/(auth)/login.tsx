import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View, ActivityIndicator, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DibsLogo } from '@/components/dibs-logo';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, FontFamilies } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useViewportDimensions } from '@/hooks/use-viewport-dimensions';
import { ResponsiveWrapper } from '@/components/responsive-wrapper';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { isMobile, isTablet } = useViewportDimensions();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const inputBg = theme.inputBg;
  const placeholderColor = colorScheme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(15,26,43,0.4)';

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ResponsiveWrapper maxWidth={isTablet ? 450 : 500} style={styles.content}>
          <View style={styles.topSection}>
            <View style={styles.logoContainer}>
              <DibsLogo width={isMobile ? 200 : 260} height={isMobile ? 77 : 100} />
            </View>

            <View style={styles.form}>
              <ThemedText type="title" style={[styles.headerTitle, { color: theme.text, fontSize: isMobile ? 24 : 32 }]}>
                Welcome back
              </ThemedText>
              <ThemedText style={[styles.subTitle, { color: theme.mutedText, fontSize: isMobile ? 14 : 16 }]}>
                Sign in with your email to continue
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
              />
              <PasswordField
                label="Password"
                placeholder="•••••••••••••"
                value={password}
                onChangeText={setPassword}
                theme={theme}
                inputBg={inputBg}
                placeholderColor={placeholderColor}
                secureTextEntry={!showPassword}
                onToggleVisibility={() => setShowPassword((v) => !v)}
                textContentType="password"
              />
              <Pressable
                onPress={() => router.push('/(auth)/forgot-password')}
                style={styles.forgotWrap}
                hitSlop={8}>
                <ThemedText style={[styles.forgotText, { color: theme.accent }]}>Forgot password?</ThemedText>
              </Pressable>

              <Pressable
                disabled={isLoading}
                onPress={async () => {
                  if (!email || !password) {
                    Alert.alert('Error', 'Please enter email and password');
                    return;
                  }
                  setIsLoading(true);
                  const { error, data } = await supabase.auth.signInWithPassword({ email, password });
                  
                  if (!error) {
                    await supabase.from('logs').insert({
                      user_id: data?.user?.id,
                      name: data?.user?.user_metadata?.full_name || email.split('@')[0],
                      details: 'Successful Login',
                      device: Platform.OS,
                      status: 'verified',
                      type: 'success',
                    });
                    signIn(email, password); 
                    router.replace('/(tabs)');
                  } else {
                    await supabase.from('logs').insert({
                      user_id: null,
                      name: email.split('@')[0] || 'Unknown User',
                      details: `Failed Login: ${error.message}`,
                      device: Platform.OS,
                      status: 'blocked',
                      type: 'danger',
                    });
                    Alert.alert('Login Failed', error.message);
                  }
                  setIsLoading(false);
                }}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: theme.primary, opacity: pressed || isLoading ? 0.8 : 1 },
                ]}>
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.primaryButtonText}>Sign in</ThemedText>
                )}
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={() => router.push('/(auth)/signup')}
            style={({ pressed }) => [styles.footerLink, { opacity: pressed ? 0.8 : 1 }]}>
            <ThemedText style={[styles.footerLinkText, { color: theme.mutedText, fontSize: isMobile ? 14 : 16 }]}>
              New on DIBS? <ThemedText style={{ color: theme.accent, fontFamily: FontFamilies.medium }}>Create an account</ThemedText>
            </ThemedText>
          </Pressable>
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

function PasswordField({
  label,
  placeholder,
  theme,
  inputBg,
  placeholderColor,
  secureTextEntry,
  onToggleVisibility,
  ...props
}: {
  label: string;
  placeholder?: string;
  theme: typeof Colors.light;
  inputBg: string;
  placeholderColor: string;
  secureTextEntry: boolean;
  onToggleVisibility: () => void;
} & ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.fieldWrap}>
      <ThemedText style={[styles.fieldLabel, { color: theme.text }]}>{label}</ThemedText>
      <View style={styles.passwordInputWrap}>
        <TextInput
          placeholder={placeholder ?? label}
          placeholderTextColor={placeholderColor}
          secureTextEntry={secureTextEntry}
          style={[
            styles.input,
            styles.inputWithRightIcon,
            {
              backgroundColor: inputBg,
              borderColor: theme.inputBorder,
              color: theme.text,
            },
          ]}
          {...props}
        />
        <Pressable
          onPress={onToggleVisibility}
          style={styles.eyeButton}
          hitSlop={12}
          accessibilityLabel={secureTextEntry ? 'Show password' : 'Hide password'}>
          <MaterialIcons
            name={secureTextEntry ? 'visibility-off' : 'visibility'}
            size={22}
            color={theme.mutedText}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 24, justifyContent: 'space-between' },
  topSection: { },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  headerTitle: { fontFamily: FontFamilies.semiBold, lineHeight: 40, letterSpacing: -1, marginBottom: 4 },
  subTitle: { lineHeight: 22, opacity: 0.9, marginBottom: 24 },
  form: { gap: 16 },
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
  passwordInputWrap: { position: 'relative', justifyContent: 'center' },
  inputWithRightIcon: { paddingRight: 48 },
  eyeButton: {
    position: 'absolute',
    right: 14,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  forgotWrap: { alignSelf: 'flex-end', marginTop: -4 },
  forgotText: { fontSize: 14, fontFamily: FontFamilies.medium },
  primaryButton: {
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: FontFamilies.semiBold,
  },
  footerLink: { paddingVertical: 24, alignItems: 'center' },
  footerLinkText: { fontFamily: FontFamilies.medium },
});
