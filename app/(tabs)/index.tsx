import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Pill } from '@/components/ui/pill';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Colors, FontFamilies } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type ActivityItem = {
  id: string;
  title: string;
  timestamp: string;
  deviceId: string;
  status: 'VERIFIED' | 'BLOCKED';
};

const RECENT_ACTIVITY: ActivityItem[] = [
  {
    id: '1',
    title: 'Vault item accessed',
    timestamp: 'Today · 10:42 AM',
    deviceId: 'android-8f2c',
    status: 'VERIFIED',
  },
  {
    id: '2',
    title: 'Unauthorized attempt',
    timestamp: 'Today · 09:18 AM',
    deviceId: 'android-8f2c',
    status: 'BLOCKED',
  },
  {
    id: '3',
    title: 'Liveness check completed',
    timestamp: 'Yesterday · 7:03 PM',
    deviceId: 'android-8f2c',
    status: 'VERIFIED',
  },
];

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const enableLayoutAnimations = process.env.EXPO_OS !== 'web';

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={
              colorScheme === 'dark'
                ? ['rgba(34, 198, 217, 0.16)', 'rgba(7, 10, 18, 0)']
                : ['rgba(34, 198, 217, 0.18)', 'rgba(246, 247, 251, 0)']
            }
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
            style={styles.topGlow}
          />
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Animated.View
            style={styles.headerRow}
            {...(enableLayoutAnimations ? { entering: FadeInDown.duration(240) } : {})}>
            <SurfaceCard variant="glass" style={styles.heroCard}>
              <View style={styles.heroTopRow}>
                <View style={[styles.headerIconWrap, { backgroundColor: theme.surface }]}>
                  <MaterialIcons name="verified-user" size={18} color={theme.primary} />
                </View>
                <View style={styles.headerText}>
                  <ThemedText type="title" style={styles.headerTitle}>
                    DIBS
                  </ThemedText>
                  <ThemedText style={{ color: theme.mutedText, fontFamily: FontFamilies.medium }}>
                    Protection Active
                  </ThemedText>
                </View>
                <Pill
                  style={{ borderColor: 'transparent', backgroundColor: theme.surface }}
                  tone="neutral">
                  <MaterialIcons name="shield" size={16} color={theme.primary} />
                </Pill>
              </View>
              <View style={styles.heroMetaRow}>
                <Pill tone="success" style={styles.metaPill}>
                  <MaterialIcons name="lock" size={14} color={theme.success} />
                  <ThemedText style={{ fontFamily: FontFamilies.medium, color: theme.text, fontSize: 11 }}>
                    Vault Locked
                  </ThemedText>
                </Pill>
                <Pill tone="accent" style={styles.metaPill}>
                  <MaterialIcons name="bolt" size={14} color={theme.accent} />
                  <ThemedText style={{ fontFamily: FontFamilies.medium, color: theme.text, fontSize: 11 }}>
                    Liveness Ready
                  </ThemedText>
                </Pill>
              </View>
            </SurfaceCard>
          </Animated.View>

          <Animated.View
            style={styles.statsRow}
            {...(enableLayoutAnimations ? { entering: FadeInUp.duration(240) } : {})}>
            <SurfaceCard style={styles.bentoCard}>
              <View style={styles.cardTopRow}>
                <LinearGradient
                  colors={
                    colorScheme === 'dark'
                      ? ['rgba(34, 198, 217, 0.24)', 'rgba(106, 168, 255, 0.10)']
                      : ['rgba(34, 198, 217, 0.20)', 'rgba(10, 46, 101, 0.08)']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardIcon}>
                  <MaterialIcons name="image" size={16} color={theme.primary} />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ color: theme.mutedText, fontFamily: FontFamilies.medium }}>
                    Images
                  </ThemedText>
                  <ThemedText style={styles.cardValue}>12</ThemedText>
                </View>
              </View>
            </SurfaceCard>

            <SurfaceCard style={styles.bentoCard}>
              <View style={styles.cardTopRow}>
                <LinearGradient
                  colors={
                    colorScheme === 'dark'
                      ? ['rgba(106, 168, 255, 0.22)', 'rgba(34, 198, 217, 0.10)']
                      : ['rgba(10, 46, 101, 0.12)', 'rgba(34, 198, 217, 0.16)']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cardIcon}>
                  <MaterialIcons name="videocam" size={16} color={theme.primary} />
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <ThemedText style={{ color: theme.mutedText, fontFamily: FontFamilies.medium }}>
                    Videos
                  </ThemedText>
                  <ThemedText style={styles.cardValue}>4</ThemedText>
                </View>
              </View>
            </SurfaceCard>
          </Animated.View>

          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle">Recent Activity</ThemedText>
            <Pill style={styles.sectionPill} tone="neutral">
              <ThemedText style={{ fontFamily: FontFamilies.medium, fontSize: 11, color: theme.mutedText }}>
                View all
              </ThemedText>
              <MaterialIcons name="chevron-right" size={16} color={theme.mutedText} />
            </Pill>
          </View>

          <Animated.View
            style={[styles.listCard, { backgroundColor: theme.surface2, borderColor: theme.border }]}
            {...(enableLayoutAnimations ? { entering: FadeInUp.duration(260).delay(70) } : {})}>
            {RECENT_ACTIVITY.map((item, index) => {
              const isBlocked = item.status === 'BLOCKED';
              const statusColor = isBlocked ? theme.danger : theme.success;

              return (
                <View
                  key={item.id}
                  style={[
                    styles.activityRow,
                    index > 0 ? { borderTopWidth: 1, borderTopColor: theme.border } : null,
                  ]}>
                  <View style={styles.activityLeft}>
                    <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                    <View style={styles.activityText}>
                      <ThemedText style={{ fontFamily: FontFamilies.semiBold }}>{item.title}</ThemedText>
                      <ThemedText style={{ color: theme.mutedText }}>
                        {item.timestamp} · {item.deviceId}
                      </ThemedText>
                    </View>
                  </View>

                  <MaterialIcons
                    name={isBlocked ? 'block' : 'check-circle'}
                    size={18}
                    color={statusColor}
                  />
                </View>
              );
            })}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
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
    top: -40,
    height: 320,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 4,
  },
  headerRow: {
    marginTop: 8,
    marginBottom: 12,
  },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    marginBottom: 2,
  },
  heroCard: {
    padding: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  metaPill: {
    flex: 1,
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  bentoCard: {
    flex: 1,
    padding: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardIcon: {
    width: 32,
    height: 32,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardValue: {
    fontSize: 24,
    fontFamily: FontFamilies.semiBold,
    lineHeight: 28,
  },
  sectionHeader: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionPill: {
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  listCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  activityRow: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  activityText: {
    flex: 1,
    gap: 2,
  },
});
