import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import type { ComponentProps, ReactNode } from 'react';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Pill } from '@/components/ui/pill';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Colors, FontFamilies } from '@/constants/theme';
import { useDemoSession } from '@/hooks/demo-session';
import { useColorScheme, useSetColorScheme } from '@/hooks/use-color-scheme';

export default function SettingsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const setColorScheme = useSetColorScheme();
  const { signOut } = useDemoSession();
  const enableLayoutAnimations = process.env.EXPO_OS !== 'web';
  const insets = useSafeAreaInsets();

  const [biometricUnlock, setBiometricUnlock] = useState(true);
  const [offlineAccess, setOfflineAccess] = useState(false);
  const [watermark, setWatermark] = useState(true);

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={
              colorScheme === 'dark'
                ? ['rgba(106, 168, 255, 0.14)', 'rgba(7, 10, 18, 0)']
                : ['rgba(106, 168, 255, 0.14)', 'rgba(246, 247, 251, 0)']
            }
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.topGlow}
          />
        </View>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: 110 + insets.bottom }]}
          showsVerticalScrollIndicator={false}>
          <Animated.View
            style={styles.header}
            {...(enableLayoutAnimations ? { entering: FadeInDown.duration(240) } : {})}>
            <SurfaceCard variant="glass" style={styles.heroCard}>
              <View style={styles.heroRow}>
                <View style={[styles.heroIcon, { backgroundColor: theme.surface }]}>
                  <MaterialIcons name="settings" size={18} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText type="title" style={{ marginBottom: 2 }}>
                    Settings
                  </ThemedText>
                  <ThemedText style={{ color: theme.mutedText, fontFamily: FontFamilies.medium }}>
                    Account, security, and privacy controls.
                  </ThemedText>
                </View>
              </View>
            </SurfaceCard>
          </Animated.View>

          <Animated.View {...(enableLayoutAnimations ? { entering: FadeInUp.duration(240) } : {})}>
            <Section title="Account" theme={theme}>
              <Row icon="person" label="Profile" value="John Doe" theme={theme} onPress={() => {}} />
              <Row
                icon="mail"
                label="Email"
                value="john.doe@example.com"
                theme={theme}
                onPress={() => {}}
              />
            </Section>
          </Animated.View>

          <Animated.View {...(enableLayoutAnimations ? { entering: FadeInUp.duration(240).delay(40) } : {})}>
            <Section title="Appearance" theme={theme}>
              <ToggleRow
                icon="dark-mode"
                label="Dark Mode"
                value={colorScheme === 'dark'}
                onValueChange={(value) => setColorScheme(value ? 'dark' : 'light')}
                theme={theme}
              />
            </Section>
          </Animated.View>

          <Animated.View {...(enableLayoutAnimations ? { entering: FadeInUp.duration(240).delay(80) } : {})}>
            <Section title="Security" theme={theme}>
              <ToggleRow
                icon="fingerprint"
                label="Biometric Unlock"
                value={biometricUnlock}
                onValueChange={setBiometricUnlock}
                theme={theme}
              />
              <ToggleRow
                icon="cloud-off"
                label="Partial Offline Access"
                value={offlineAccess}
                onValueChange={setOfflineAccess}
                theme={theme}
              />
            </Section>
          </Animated.View>

          <Animated.View {...(enableLayoutAnimations ? { entering: FadeInUp.duration(240).delay(120) } : {})}>
            <Section title="Privacy" theme={theme}>
              <ToggleRow
                icon="visibility"
                label="Viewer Watermark"
                value={watermark}
                onValueChange={setWatermark}
                theme={theme}
              />
              <Row icon="security" label="Permissions" value="Review" theme={theme} onPress={() => {}} />
            </Section>
          </Animated.View>

          <Animated.View {...(enableLayoutAnimations ? { entering: FadeInUp.duration(240).delay(160) } : {})}>
            <Pressable
              onPress={() => {
                signOut();
                router.replace('/(auth)/login');
              }}
              style={({ pressed }) => [
                styles.logoutButton,
                {
                  borderColor: theme.danger,
                  opacity: pressed ? 0.86 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}>
              <ThemedText style={{ color: theme.danger, fontFamily: FontFamilies.semiBold }}>Logout</ThemedText>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function Section({
  title,
  theme,
  children,
}: {
  title: string;
  theme: typeof Colors.light;
  children: ReactNode;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <View style={styles.sectionHeader}>
        <ThemedText style={{ color: theme.mutedText, fontFamily: FontFamilies.semiBold }}>
          {title}
        </ThemedText>
        <Pill tone="neutral" style={styles.sectionPill}>
          <MaterialIcons name="tune" size={15} color={theme.mutedText} />
        </Pill>
      </View>
      <SurfaceCard style={styles.sectionCard}>{children}</SurfaceCard>
    </View>
  );
}

function Row({
  icon,
  label,
  value,
  theme,
  onPress,
}: {
  icon: ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  value: string;
  theme: typeof Colors.light;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { opacity: pressed ? 0.94 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] },
      ]}>
      <View style={[styles.rowIconWrap, { backgroundColor: theme.surface }]}>
        <MaterialIcons name={icon} size={16} color={theme.primary} />
      </View>
      <View style={styles.rowText}>
        <ThemedText style={{ fontFamily: FontFamilies.semiBold }}>{label}</ThemedText>
        <ThemedText style={{ color: theme.mutedText }} numberOfLines={1}>
          {value}
        </ThemedText>
      </View>
      <Pill tone="neutral" style={styles.chevronPill}>
        <MaterialIcons name="chevron-right" size={18} color={theme.icon} />
      </Pill>
    </Pressable>
  );
}

function ToggleRow({
  icon,
  label,
  value,
  onValueChange,
  theme,
}: {
  icon: ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  theme: typeof Colors.light;
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.rowIconWrap, { backgroundColor: theme.surface }]}>
        <MaterialIcons name={icon} size={16} color={theme.primary} />
      </View>
      <View style={styles.rowText}>
        <ThemedText style={{ fontFamily: FontFamilies.semiBold }}>{label}</ThemedText>
        <ThemedText style={{ color: theme.mutedText }}>{value ? 'On' : 'Off'}</ThemedText>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.border, true: theme.accent }}
        thumbColor={colorSchemeThumb(theme)}
      />
    </View>
  );
}

function colorSchemeThumb(theme: typeof Colors.light) {
  return theme.surface2;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  topGlow: {
    position: 'absolute',
    left: -40,
    right: -40,
    top: -60,
    height: 300,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  header: {
    paddingTop: 8,
    paddingBottom: 12,
  },
  heroCard: {
    padding: 12,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sectionPill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  sectionCard: {
    padding: 0,
    overflow: 'hidden',
  },
  row: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  chevronPill: {
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderColor: 'transparent',
  },
  logoutButton: {
    marginTop: 8,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
