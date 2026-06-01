import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, FontFamilies } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useViewportDimensions } from '@/hooks/use-viewport-dimensions';
import { ResponsiveWrapper } from '@/components/responsive-wrapper';
import { supabase } from '@/lib/supabase';

const DEFAULT_AVATAR = require('@/assets/images/face.png');

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateName, updateEmail, updatePassword, updateAvatar, refreshUser } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { isMobile, isTablet } = useViewportDimensions();

  const [fullName, setFullName] = useState(user?.user_metadata?.full_name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [avatarUri, setAvatarUri] = useState<string | null>(
    user?.user_metadata?.avatar_url ?? null
  );

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const inputBg = theme.inputBg;
  const placeholderColor = colorScheme === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(15,26,43,0.4)';

  const handlePickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    setUploadingImage(true);

    try {
      const fileExt = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const fileName = `${user?.id ?? 'unknown'}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, blob, { upsert: true, contentType: `image/${fileExt}` });

      if (uploadError) {
        // If bucket doesn't exist, alert user
        if (uploadError.message?.includes('bucket') || uploadError.message?.includes('not found')) {
          Alert.alert(
            'Storage not ready',
            'Please create an "avatars" bucket in your Supabase Storage and make it public.'
          );
        } else {
          Alert.alert('Upload failed', uploadError.message);
        }
        setUploadingImage(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = urlData?.publicUrl;

      if (publicUrl) {
        const { error } = await updateAvatar(publicUrl);
        if (error) {
          Alert.alert('Error', error.message);
        } else {
          setAvatarUri(publicUrl);
          await refreshUser();
          Alert.alert('Updated', 'Profile picture updated successfully');
        }
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  }, [user?.id, updateAvatar, refreshUser]);

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setSavingProfile(true);
    const errors: string[] = [];

    if (fullName.trim() !== (user?.user_metadata?.full_name ?? '')) {
      const { error } = await updateName(fullName.trim());
      if (error) errors.push(`Name: ${error.message}`);
    }

    if (email.trim().toLowerCase() !== (user?.email ?? '').toLowerCase()) {
      const { error } = await updateEmail(email.trim());
      if (error) errors.push(`Email: ${error.message}`);
    }

    setSavingProfile(false);

    if (errors.length > 0) {
      Alert.alert('Update failed', errors.join('\n'));
    } else {
      await refreshUser();
      Alert.alert('Saved', 'Profile updated successfully');
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    setSavingPassword(true);
    const { error } = await updatePassword(newPassword);
    setSavingPassword(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Saved', 'Password changed successfully. Use your new password next time you sign in.');
    }
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <ResponsiveWrapper maxWidth={isTablet ? 450 : 500} style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.7 : 1 }]}>
              <MaterialIcons name="arrow-back" size={24} color={theme.text} />
            </Pressable>
            <ThemedText
              type="title"
              style={[styles.headerTitle, { color: theme.text, fontSize: isMobile ? 20 : 24 }]}>
              Edit Profile
            </ThemedText>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {/* Avatar */}
            <View style={styles.avatarSection}>
              <Pressable onPress={handlePickImage} disabled={uploadingImage}>
                <View style={styles.avatarWrap}>
                  {uploadingImage ? (
                    <View style={[styles.avatar, { backgroundColor: theme.inputBg, justifyContent: 'center', alignItems: 'center' }]}>
                      <ActivityIndicator color={theme.accent} />
                    </View>
                  ) : (
                    <Image
                      source={avatarUri ? { uri: avatarUri } : DEFAULT_AVATAR}
                      style={styles.avatar}
                      contentFit="cover"
                    />
                  )}
                  <View style={[styles.cameraBadge, { backgroundColor: theme.accent }]}>
                    <MaterialIcons name="photo-camera" size={14} color="#FFF" />
                  </View>
                </View>
              </Pressable>
              <ThemedText style={[styles.changePhotoText, { color: theme.accent }]}>
                Change photo
              </ThemedText>
            </View>

            {/* Profile Info */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <ThemedText style={[styles.cardTitle, { color: theme.mutedText }]}>Profile Info</ThemedText>

              <Field
                label="Full Name"
                value={fullName}
                onChangeText={setFullName}
                theme={theme}
                inputBg={inputBg}
                placeholderColor={placeholderColor}
                placeholder="e.g. Jenny Wilson"
              />
              <Field
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                theme={theme}
                inputBg={inputBg}
                placeholderColor={placeholderColor}
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
                placeholder="e.g. wilson09@gmail.com"
              />

              <Pressable
                disabled={savingProfile}
                onPress={handleSaveProfile}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: theme.primary, opacity: pressed || savingProfile ? 0.8 : 1 },
                ]}>
                {savingProfile ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.primaryButtonText}>Save Profile</ThemedText>
                )}
              </Pressable>
            </View>

            {/* Change Password */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <ThemedText style={[styles.cardTitle, { color: theme.mutedText }]}>Change Password</ThemedText>

              <PasswordField
                label="Current Password"
                placeholder="•••••••••••••"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                theme={theme}
                inputBg={inputBg}
                placeholderColor={placeholderColor}
                secureTextEntry={!showCurrent}
                onToggleVisibility={() => setShowCurrent((v) => !v)}
              />
              <PasswordField
                label="New Password"
                placeholder="•••••••••••••"
                value={newPassword}
                onChangeText={setNewPassword}
                theme={theme}
                inputBg={inputBg}
                placeholderColor={placeholderColor}
                secureTextEntry={!showNew}
                onToggleVisibility={() => setShowNew((v) => !v)}
                textContentType="newPassword"
              />
              <PasswordField
                label="Confirm New Password"
                placeholder="•••••••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                theme={theme}
                inputBg={inputBg}
                placeholderColor={placeholderColor}
                secureTextEntry={!showConfirm}
                onToggleVisibility={() => setShowConfirm((v) => !v)}
                textContentType="newPassword"
              />

              <Pressable
                disabled={savingPassword}
                onPress={handleChangePassword}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: theme.primary, opacity: pressed || savingPassword ? 0.8 : 1 },
                ]}>
                {savingPassword ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <ThemedText style={styles.primaryButtonText}>Change Password</ThemedText>
                )}
              </Pressable>
            </View>
          </ScrollView>
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
} & React.ComponentProps<typeof TextInput>) {
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
} & React.ComponentProps<typeof TextInput>) {
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  backButton: { padding: 4 },
  headerTitle: { fontFamily: FontFamilies.semiBold, lineHeight: 30, flex: 1 },
  headerSpacer: { width: 32 },
  scrollContent: { paddingTop: 8, paddingBottom: 32, gap: 20 },
  avatarSection: { alignItems: 'center', marginBottom: 8 },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  changePhotoText: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: FontFamilies.medium,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  cardTitle: {
    fontSize: 13,
    fontFamily: FontFamilies.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
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
    marginTop: 8,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontFamily: FontFamilies.semiBold },
});
