import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, FontFamilies } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme, useSetColorScheme } from '@/hooks/use-color-scheme';
import { useViewportDimensions } from '@/hooks/use-viewport-dimensions';
import { ResponsiveWrapper } from '@/components/responsive-wrapper';
import { deleteEnrollment } from '@/lib/face-recognition';
import { supabase } from '@/lib/supabase';

const SettingsScreen = () => {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const setColorScheme = useSetColorScheme();
  const { user, signOut } = useAuth();
  const insets = useSafeAreaInsets();
  const { isMobile, isTablet } = useViewportDimensions();

  const [darkMode, setDarkMode] = useState(colorScheme === 'dark');
  const [offlineAccess, setOfflineAccess] = useState(true);
  const [requireFaceScan, setRequireFaceScan] = useState(true);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const handleEnrollFace = () => {
    router.push('/(auth)/face-enroll');
  };

  const handleConfirmReset = async () => {
    if (!user?.id || resetting) return;
    setResetting(true);
    setResetError(null);
    try {
      await deleteEnrollment(user.id);
      await supabase.from('logs').insert({
        user_id: user.id,
        name:
          user.user_metadata?.full_name ||
          user.email?.split('@')[0] ||
          'User',
        details: 'Face ID reset by user',
        device: Platform.OS,
        status: 'verified',
        type: 'success',
      });
      setResetModalVisible(false);
      router.push('/(auth)/face-enroll');
    } catch (err: any) {
      setResetError(err?.message ?? 'Failed to reset Face ID. Try again.');
    } finally {
      setResetting(false);
    }
  };

  const handleDarkMode = (value: boolean) => {
    setDarkMode(value);
    setColorScheme(value ? 'dark' : 'light');
  };

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || 'No email provided';
  const userId = user?.id ? `ID: ${user.id.slice(0, 8).toUpperCase()}` : 'ID: UNKNOWN';

  const cardBg = theme.cardTint;
  const cardBorder = theme.cardTintBorder;
  const dividerColor = colorScheme === 'dark' ? 'rgba(34, 198, 217, 0.08)' : 'rgba(34, 198, 217, 0.12)';
  const sectionTitleColor = theme.mutedText;
  const toggleTrackOn = '#2563EB';

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ResponsiveWrapper maxWidth={isTablet ? 800 : 700} style={styles.wrapper}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.headerIcon, { backgroundColor: cardBg }]}>
              <MaterialIcons name="settings" size={isMobile ? 24 : 32} color={theme.accent} />
            </View>
            <ThemedText style={[styles.headerTitle, { color: theme.text, fontSize: isMobile ? 18 : 24 }]}>Settings</ThemedText>
          </View>

          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
            showsVerticalScrollIndicator={false}>
            {/* Main content card */}
            <View style={[styles.contentCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              {/* --- Account --- */}
              <ThemedText style={[styles.sectionTitle, { color: sectionTitleColor }]}>Account</ThemedText>
              <View style={[styles.block, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Pressable style={({ pressed }) => [styles.profileRow, { opacity: pressed ? 0.9 : 1 }]}>
                  <Image
                    source={require('../../assets/images/face.png')}
                    style={[styles.avatar, !isMobile && { width: 80, height: 80, borderRadius: 40 }]}
                  />
                  <View style={styles.profileText}>
                    <ThemedText style={[styles.profileName, { color: theme.text, fontSize: isMobile ? 16 : 20 }]}>{userName}</ThemedText>
                    <ThemedText style={[styles.profileEmail, { color: theme.mutedText, fontSize: isMobile ? 12 : 14 }]}>{userEmail}</ThemedText>
                    <ThemedText style={[styles.profileId, { color: theme.accent }]}>{userId}</ThemedText>
                  </View>
                  <MaterialIcons name="chevron-right" size={24} color={theme.mutedText} style={{ opacity: 0.6 }} />
                </Pressable>
                <View style={[styles.divider, { backgroundColor: dividerColor }]} />
                <Pressable
                  onPress={handleEnrollFace}
                  style={({ pressed }) => [styles.row, { opacity: pressed ? 0.9 : 1 }]}>
                  <LinearGradient
                    colors={theme.blueGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconCircle}>
                    <MaterialIcons name="face" size={14} color="#FFF" />
                  </LinearGradient>
                  <ThemedText style={[styles.rowLabel, { color: theme.text, fontSize: isMobile ? 12 : 15 }]}>
                    Enroll Face ID
                  </ThemedText>
                  <MaterialIcons name="chevron-right" size={20} color={theme.mutedText} style={{ opacity: 0.6 }} />
                </Pressable>
                <View style={[styles.divider, { backgroundColor: dividerColor }]} />
                <Pressable
                  onPress={() => {
                    setResetError(null);
                    setResetModalVisible(true);
                  }}
                  style={({ pressed }) => [styles.row, { opacity: pressed ? 0.9 : 1 }]}>
                  <LinearGradient
                    colors={theme.dangerGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconCircle}>
                    <MaterialIcons name="restart-alt" size={14} color="#FFF" />
                  </LinearGradient>
                  <ThemedText style={[styles.rowLabel, { color: theme.text, fontSize: isMobile ? 12 : 15 }]}>
                    Reset Face ID
                  </ThemedText>
                  <MaterialIcons name="chevron-right" size={20} color={theme.mutedText} style={{ opacity: 0.6 }} />
                </Pressable>
              </View>

              {/* --- Appearance --- */}
              <ThemedText style={[styles.sectionTitle, { color: sectionTitleColor }]}>Appearance</ThemedText>
              <View style={[styles.block, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={styles.row}>
                  <LinearGradient
                    colors={['#F2EA1B', '#C0B800']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconCircle}>
                    <MaterialIcons name="dark-mode" size={14} color="#FFF" />
                  </LinearGradient>
                  <ThemedText style={[styles.rowLabel, { color: theme.text, fontSize: isMobile ? 12 : 15 }]}>Dark Mode</ThemedText>
                  <Switch
                    value={darkMode}
                    onValueChange={handleDarkMode}
                    trackColor={{ false: theme.border, true: toggleTrackOn }}
                    thumbColor="#D9D9D9"
                  />
                </View>
              </View>

              {/* --- Security --- */}
              <ThemedText style={[styles.sectionTitle, { color: sectionTitleColor }]}>Security</ThemedText>
              <View style={[styles.block, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={styles.row}>
                  <LinearGradient colors={theme.blueGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconCircle}>
                    <MaterialIcons name="cloud-off" size={14} color="#FFF" />
                  </LinearGradient>
                  <ThemedText style={[styles.rowLabel, { color: theme.text, fontSize: isMobile ? 12 : 15 }]}>Offline Access</ThemedText>
                  <Switch
                    value={offlineAccess}
                    onValueChange={setOfflineAccess}
                    trackColor={{ false: theme.border, true: toggleTrackOn }}
                    thumbColor="#D9D9D9"
                  />
                </View>
                <View style={[styles.divider, { backgroundColor: dividerColor }]} />
                <View style={styles.row}>
                  <LinearGradient colors={theme.dangerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconCircle}>
                    <MaterialIcons name="lock" size={14} color="#FFF" />
                  </LinearGradient>
                  <ThemedText style={[styles.rowLabel, { color: theme.text, fontSize: isMobile ? 12 : 15 }]}>Require Face Scan</ThemedText>
                  <Switch
                    value={requireFaceScan}
                    onValueChange={setRequireFaceScan}
                    trackColor={{ false: theme.border, true: toggleTrackOn }}
                    thumbColor="#D9D9D9"
                  />
                </View>
                <View style={[styles.divider, { backgroundColor: dividerColor }]} />
                <Pressable style={({ pressed }) => [styles.row, { opacity: pressed ? 0.9 : 1 }]}>
                  <LinearGradient colors={['#F2EA1B', '#C0B800']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconCircle}>
                    <MaterialIcons name="fingerprint" size={14} color="#FFF" />
                  </LinearGradient>
                  <ThemedText style={[styles.rowLabel, { color: theme.text, fontSize: isMobile ? 12 : 15 }]}>Biometric Logs</ThemedText>
                  <MaterialIcons name="chevron-right" size={20} color={theme.mutedText} style={{ opacity: 0.6 }} />
                </Pressable>
              </View>

              {/* --- Privacy & Compliance --- */}
              <ThemedText style={[styles.sectionTitle, { color: sectionTitleColor }]}>Privacy & Compliance</ThemedText>
              <View style={[styles.block, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Pressable style={({ pressed }) => [styles.row, { opacity: pressed ? 0.9 : 1 }]}>
                  <LinearGradient colors={theme.blueGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconCircle}>
                    <MaterialIcons name="shield" size={14} color="#FFF" />
                  </LinearGradient>
                  <ThemedText style={[styles.rowLabel, { color: theme.text, fontSize: isMobile ? 12 : 15 }]}>Data Retention Policy</ThemedText>
                  <MaterialIcons name="chevron-right" size={20} color={theme.mutedText} style={{ opacity: 0.6 }} />
                </Pressable>
                <View style={[styles.divider, { backgroundColor: dividerColor }]} />
                <Pressable style={({ pressed }) => [styles.row, { opacity: pressed ? 0.9 : 1 }]}>
                  <LinearGradient colors={theme.dangerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.iconCircle}>
                    <MaterialIcons name="file-download" size={14} color="#FFF" />
                  </LinearGradient>
                  <ThemedText style={[styles.rowLabel, { color: theme.text, fontSize: isMobile ? 12 : 15 }]}>Export User Data</ThemedText>
                  <MaterialIcons name="chevron-right" size={20} color={theme.mutedText} style={{ opacity: 0.6 }} />
                </Pressable>
              </View>

              {/* Log Out */}
              <Pressable
                onPress={async () => {
                  if (user) {
                    await supabase.from('logs').insert({
                      user_id: user.id,
                      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                      details: 'User forcibly logged out',
                      device: Platform.OS,
                      status: 'verified',
                      type: 'success',
                    });
                  }
                  signOut();
                  router.replace('/(auth)/login');
                }}
                style={({ pressed }) => [
                  styles.logoutButton,
                  { backgroundColor: theme.primary, opacity: pressed ? 0.9 : 1 },
                ]}>
                <ThemedText style={styles.logoutText}>Log Out</ThemedText>
              </Pressable>
            </View>
          </ScrollView>
        </ResponsiveWrapper>
      </SafeAreaView>

      <Modal
        visible={resetModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !resetting && setResetModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.background, borderColor: theme.border },
            ]}>
            <View style={[styles.modalIconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
              <MaterialIcons name="warning-amber" size={30} color="#EF4444" />
            </View>
            <ThemedText style={[styles.modalTitle, { color: theme.text }]}>
              Reset Face ID?
            </ThemedText>
            <ThemedText style={[styles.modalBody, { color: theme.mutedText }]}>
              Your enrolled face data will be permanently deleted. You&apos;ll need to enroll
              again to unlock the vault with Face ID.
            </ThemedText>

            {resetError ? (
              <ThemedText style={styles.modalError}>{resetError}</ThemedText>
            ) : null}

            <View style={styles.modalButtonRow}>
              <Pressable
                disabled={resetting}
                onPress={() => setResetModalVisible(false)}
                style={({ pressed }) => [
                  styles.modalButton,
                  styles.modalButtonSecondary,
                  { borderColor: theme.border, opacity: pressed ? 0.85 : 1 },
                ]}>
                <ThemedText style={[styles.modalButtonText, { color: theme.text }]}>
                  Cancel
                </ThemedText>
              </Pressable>
              <Pressable
                disabled={resetting}
                onPress={handleConfirmReset}
                style={({ pressed }) => [
                  styles.modalButton,
                  { backgroundColor: '#EF4444', opacity: pressed ? 0.9 : 1 },
                ]}>
                {resetting ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <ThemedText style={[styles.modalButtonText, { color: '#FFF' }]}>
                    Reset
                  </ThemedText>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  wrapper: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 14,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FontFamilies.semiBold,
    lineHeight: 30,
  },
  scrollContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  contentCard: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderWidth: 1,
    borderTopWidth: 0,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 24,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: FontFamilies.medium,
    lineHeight: 30,
    marginBottom: 0,
    marginLeft: 4,
  },
  block: {
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 12,
    marginBottom: 24,
    overflow: 'hidden',
    paddingHorizontal: 16,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 0,
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  profileText: { flex: 1, minWidth: 0 },
  profileName: { fontFamily: FontFamilies.medium, lineHeight: 30 },
  profileEmail: { lineHeight: 19, opacity: 0.8 },
  profileId: { fontSize: 12, lineHeight: 19 },
  divider: {
    height: 1,
    alignSelf: 'stretch',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 0,
    gap: 14,
    minWidth: 0,
  },
  iconCircle: {
    width: 32,
    height: 32,
    minWidth: 32,
    minHeight: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rowLabel: {
    flex: 1,
    minWidth: 0,
    fontFamily: FontFamilies.regular,
    lineHeight: 19,
  },
  logoutButton: {
    marginTop: 32,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: FontFamilies.semiBold,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 22,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  modalIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: FontFamilies.semiBold,
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalBody: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 18,
    fontFamily: FontFamilies.regular,
  },
  modalError: {
    color: '#EF4444',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: FontFamilies.medium,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  modalButtonText: {
    fontSize: 14,
    fontFamily: FontFamilies.semiBold,
  },
});
