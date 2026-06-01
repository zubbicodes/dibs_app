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

type Stage = 'form' | 'success';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { updatePassword, signOut } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { isMobile, isTablet } = useViewportDimensions();

  const [stage, setStage] = useState<Stage>('form');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const inputBg = theme.inputBg;
  const placeholderColor = colorScheme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(15,26,43,0.4)';

  const handleUpdatePassword = async () => {
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in both fields');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    const { error } = await updatePassword(password);
    setIsLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      // Sign the user out so they must log in again with the new password.
      await signOut();
      setStage('success');
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
              {stage === 'form' && (
                <>
                  <ThemedText
                    type="title"
                    style={[styles.headerTitle, { color: theme.text, fontSize: isMobile ? 24 : 32 }]}>
                    Create new password
                  </ThemedText>
                  <ThemedText
                    style={[styles.subTitle, { color: theme.mutedText, fontSize: isMobile ? 14 : 16 }]}>
                    Your identity is verified. Enter a new password below.
                  </ThemedText>

                  <PasswordField
                    label="New password"
                    placeholder="•••••••••••••"
                    value={password}
                    onChangeText={setPassword}
                    theme={theme}
                    inputBg={inputBg}
                    placeholderColor={placeholderColor}
                    secureTextEntry={!showPassword}
                    onToggleVisibility={() => setShowPassword((v) => !v)}
                    textContentType="newPassword"
                  />
                  <PasswordField
                    label="Confirm new password"
                    placeholder="•••••••••••••"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    theme={theme}
                    inputBg={inputBg}
                    placeholderColor={placeholderColor}
                    secureTextEntry={!showConfirmPassword}
                    onToggleVisibility={() => setShowConfirmPassword((v) => !v)}
                    textContentType="newPassword"
                  />

                  <Pressable
                    disabled={isLoading}
                    onPress={handleUpdatePassword}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      { backgroundColor: theme.primary, opacity: pressed || isLoading ? 0.8 : 1 },
                    ]}>
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <ThemedText style={styles.primaryButtonText}>Update password</ThemedText>
                    )}
                  </Pressable>
                </>
              )}

              {stage === 'success' && (
                <View style={styles.centeredState}>
                  <View
                    style={[
                      styles.successIconWrap,
                      { backgroundColor: theme.success + '18' },
                    ]}>
                    <MaterialIcons name="check-circle" size={40} color={theme.success} />
                  </View>
                  <ThemedText
                    type="title"
                    style={[styles.headerTitle, { color: theme.text, textAlign: 'center', marginTop: 8 }]}>
                    Password updated
                  </ThemedText>
                  <ThemedText
                    style={[styles.subTitle, { color: theme.mutedText, textAlign: 'center', marginBottom: 32 }]}>
                    Your password has been changed successfully. Please sign in with your new password.
                  </ThemedText>
                  <Pressable
                    onPress={() => router.replace('/(auth)/login')}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      {
                        backgroundColor: theme.primary,
                        opacity: pressed ? 0.8 : 1,
                        marginTop: 0,
                      },
                    ]}>
                    <ThemedText style={styles.primaryButtonText}>Go to sign in</ThemedText>
                  </Pressable>
                </View>
              )}
            </View>
          </ScrollView>
        </ResponsiveWrapper>
      </SafeAreaView>
    </ThemedView>
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
  safeArea: { flex: 1, paddingHorizontal: 16 },
  content: { flex: 1 },
  scrollContent: { paddingTop: 24, paddingBottom: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  headerTitle: { fontFamily: FontFamilies.semiBold, lineHeight: 40, letterSpacing: -1, marginBottom: 4 },
  subTitle: { lineHeight: 22, opacity: 0.9, marginBottom: 24 },
  form: { gap: 14 },
  centeredState: { alignItems: 'center', gap: 16, marginTop: 40 },
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
  primaryButton: {
    height: 50,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontFamily: FontFamilies.semiBold },
  successIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
