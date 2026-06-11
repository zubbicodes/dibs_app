import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Platform, ScrollView, StyleSheet, View, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DibsLogo } from '@/components/dibs-logo';
import { SideMenu } from '@/components/side-menu';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, FontFamilies } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useViewportDimensions } from '@/hooks/use-viewport-dimensions';
import { ResponsiveWrapper } from '@/components/responsive-wrapper';

import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';

type ActivityItem = {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  type: 'success' | 'danger' | 'blue';
};

function formatRelativeTime(dateString?: string) {
  if (!dateString) return 'Just now';
  const diffSec = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 1000);
  if (diffSec < 60) return `${Math.max(1, diffSec)}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  return `${Math.floor(diffHour / 24)}d ago`;
}

function formatLogDetails(details?: string) {
  if (!details) return 'No details';
  if (details.includes('Downloaded secured media')) return 'Downloaded media';
  if (details.includes('Device Passcode / Fallback Verified')) return 'PIN Verified Fallback';
  if (details.includes('Device Passcode Verification Failed')) return 'Verification Failed';
  return details;
}

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const router = useRouter();
  const { user } = useAuth();
  const { isMobile, isTablet, isDesktop } = useViewportDimensions();
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState({ images: 0, videos: 0 });

  useEffect(() => {
    supabase
      .from('logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (data) {
          const mapped = data.map((d: any) => ({
            id: d.id,
            title: d.name || 'System Log',
            subtitle: formatLogDetails(d.details),
            time: formatRelativeTime(d.created_at),
            type: d.type || 'success',
          }));
          setActivities(mapped);
        }
      });

    if (user?.id) {
      supabase.storage.from('vault').list(user.id).then(({ data }) => {
        if (data) {
          let imgs = 0;
          let vids = 0;
          data.forEach(file => {
            if (file.name.match(/\.(mp4|mov|avi)$/i)) vids++;
            else if (file.name.match(/\.(png|jpg|jpeg|gif|webp)$/i)) imgs++;
          });
          setStats({ images: imgs, videos: vids });
        }
      });
    }

    const channel = supabase
      .channel('home_realtime_logs')
      .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'logs' },
          (payload) => {
            const d = payload.new as any;
            const newItem: ActivityItem = {
              id: d.id,
              title: d.name || 'System Log',
              subtitle: formatLogDetails(d.details),
              time: formatRelativeTime(d.created_at),
              type: d.type || 'success',
            };
            setActivities((prev) => [newItem, ...prev].slice(0, 3));
          }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <ResponsiveWrapper maxWidth={isDesktop ? 1100 : isTablet ? 900 : 600} style={styles.content}>
            {/* Top bar */}
            {Platform.OS === 'web' && isDesktop ? null : (
            <View style={styles.topBar}>
              <Pressable
                onPress={() => setSideMenuOpen(true)}
                style={({ pressed }) => [styles.topBarButton, pressed && styles.topBarButtonPressed]}
                hitSlop={12}
                accessibilityLabel="Open menu"
              >
                <MaterialIcons name="menu" size={28} color={theme.text} />
              </Pressable>
              <View style={styles.logoRow}>
                <DibsLogo width={110} height={42} />
              </View>
              <Pressable
                onPress={() => router.push('/notifications')}
                style={({ pressed }) => [styles.topBarButton, styles.topBarButtonRight, pressed && styles.topBarButtonPressed]}
                hitSlop={12}
                accessibilityLabel="Notifications"
              >
                <MaterialIcons name="notifications" size={26} color={theme.text} />
                <View style={[styles.notificationBadge, { backgroundColor: theme.primary }]} />
              </Pressable>
            </View>
            )}

            <View style={styles.header}>
              <View style={styles.avatarWrap}>
                <Image
                  source={require('../../assets/images/face.png')}
                  style={styles.avatar}
                />
              </View>
              <View style={styles.userInfo}>
                <ThemedText style={[styles.welcomeLabel, { color: theme.mutedText }]}>Welcome back,</ThemedText>
                <ThemedText style={[styles.userName, { color: theme.text, fontSize: isMobile ? 20 : 28 }]}>{userName}</ThemedText>
              </View>
              <View
                style={[
                  styles.protectedPill,
                  {
                    backgroundColor: colorScheme === 'dark' ? 'rgba(34, 198, 217, 0.1)' : 'rgba(34, 198, 217, 0.08)',
                    borderColor: colorScheme === 'dark' ? 'rgba(34, 198, 217, 0.2)' : 'rgba(34, 198, 217, 0.2)',
                  },
                ]}>
                <MaterialIcons name="verified-user" size={isMobile ? 12 : 16} color={theme.accent} />
                <ThemedText style={[styles.protectedText, { color: theme.accent, fontSize: isMobile ? 11 : 13 }]}>Protected</ThemedText>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={[styles.statsRow, !isMobile && { gap: 24 }]}>
              <Pressable
                style={({ pressed }) => [
                  styles.statCard,
                  {
                    backgroundColor: theme.cardTint,
                    borderColor: theme.cardTintBorder,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}>
                <LinearGradient
                  colors={theme.primary === '#E21D20' ? ['#FF3B3E', '#E21D20'] : theme.dangerGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.statIcon}>
                  <MaterialIcons name="image" size={isMobile ? 18 : 24} color="#FFF" />
                </LinearGradient>
                <ThemedText style={[styles.statValue, { color: theme.text, fontSize: isMobile ? 24 : 32 }]}>{stats.images}</ThemedText>
                <ThemedText style={[styles.statLabel, { color: theme.mutedText }]}>protected images</ThemedText>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.statCard,
                  {
                    backgroundColor: theme.cardTint,
                    borderColor: theme.cardTintBorder,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}>
                <LinearGradient
                  colors={theme.blueGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.statIcon}>
                  <MaterialIcons name="videocam" size={isMobile ? 18 : 24} color="#FFF" />
                </LinearGradient>
                <ThemedText style={[styles.statValue, { color: theme.text, fontSize: isMobile ? 24 : 32 }]}>{stats.videos}</ThemedText>
                <ThemedText style={[styles.statLabel, { color: theme.mutedText }]}>protected videos</ThemedText>
              </Pressable>
            </View>

            <View style={styles.sectionHeader}>
              <ThemedText style={[styles.sectionTitle, { color: theme.text, fontSize: isMobile ? 20 : 26 }]}>Recent Activity</ThemedText>
              <Pressable onPress={() => router.push('/(tabs)/logs')} hitSlop={8}>
                <ThemedText style={[styles.viewLogText, { color: theme.accent, fontSize: isMobile ? 12 : 14 }]}>View Log</ThemedText>
              </Pressable>
            </View>

            <View style={[styles.activityList, { backgroundColor: theme.cardTint, borderWidth: 1, borderColor: theme.cardTintBorder }]}>
              {activities.map((item, index) => (
                  <View
                    key={item.id}
                    style={[
                      styles.activityRow,
                      index > 0 && { borderTopWidth: 1, borderTopColor: theme.cardTintBorder },
                    ]}>
                    <View style={[styles.activityIcon, { backgroundColor: item.type === 'success' ? 'rgba(57, 198, 149, 0.2)' : item.type === 'danger' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(96, 165, 250, 0.2)' }]}>
                      {item.type === 'success' ? (
                        <MaterialIcons name="verified-user" size={18} color={theme.success} />
                      ) : item.type === 'danger' ? (
                        <MaterialIcons name="block" size={18} color={theme.danger} />
                      ) : (
                        <MaterialIcons name="sync" size={18} color={theme.blueGradient[0]} />
                      )}
                    </View>
                    <View style={styles.activityBody}>
                      <ThemedText style={[styles.activityTitle, { color: theme.text }]}>{item.title}</ThemedText>
                      <View style={styles.activityMeta}>
                        <ThemedText style={[styles.activitySubtitle, { color: theme.mutedText }]}>{item.subtitle}</ThemedText>
                        <View style={[styles.activityDot, { backgroundColor: theme.mutedText }]} />
                        <ThemedText style={[styles.activityTime, { color: theme.mutedText }]}>{item.time}</ThemedText>
                      </View>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color={theme.mutedText} style={{ opacity: 0.5 }} />
                  </View>
              ))}
              {activities.length === 0 && (
                <View style={styles.emptyState}>
                  <ThemedText style={{ color: theme.mutedText, textAlign: 'center' }}>No recent activity to show</ThemedText>
                </View>
              )}
            </View>
          </ResponsiveWrapper>
        </ScrollView>
      </SafeAreaView>
      <SideMenu visible={sideMenuOpen} onClose={() => setSideMenuOpen(false)} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 120, paddingTop: 8 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 0,
  },
  topBarButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarButtonRight: { position: 'relative' },
  topBarButtonPressed: { opacity: 0.7 },
  notificationBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  logoRow: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
  },
  avatarWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatar: { width: '100%', height: '100%', borderRadius: 28 },
  userInfo: { flex: 1, minWidth: 0 },
  welcomeLabel: { fontSize: 13, lineHeight: 20 },
  userName: { fontFamily: FontFamilies.medium, letterSpacing: -1, lineHeight: 30 },
  protectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 40,
    borderWidth: 1,
  },
  protectedText: { fontFamily: FontFamilies.medium },
  divider: { height: 1, marginVertical: 10, opacity: 0.05 },
  statsRow: { flexDirection: 'row', gap: 19, marginBottom: 16 },
  statCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    minHeight: 128,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: { fontFamily: FontFamilies.semiBold, lineHeight: 30 },
  statLabel: { fontSize: 10, letterSpacing: 1, lineHeight: 30, textTransform: 'lowercase' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: { fontFamily: FontFamilies.semiBold, lineHeight: 30 },
  viewLogText: { fontFamily: FontFamilies.medium },
  activityList: { borderRadius: 18, overflow: 'hidden' },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityBody: { flex: 1, minWidth: 0 },
  activityTitle: { fontSize: 14, fontFamily: FontFamilies.regular, lineHeight: 30 },
  activityMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  activitySubtitle: { fontSize: 12 },
  activityDot: { width: 3, height: 3, borderRadius: 1.5 },
  activityTime: { fontSize: 12 },
  emptyState: { padding: 32 },
});
