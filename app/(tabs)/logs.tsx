import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Pill } from '@/components/ui/pill';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Colors, FontFamilies } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type LogItem = {
  id: string;
  eventType: 'VERIFIED' | 'BLOCKED';
  mediaId: string;
  deviceId: string;
  timestamp: string;
};

const LOGS: LogItem[] = [
  {
    id: '1',
    eventType: 'VERIFIED',
    mediaId: 'media-0012',
    deviceId: 'android-8f2c',
    timestamp: '2026-02-04 10:42:12',
  },
  {
    id: '2',
    eventType: 'BLOCKED',
    mediaId: 'media-0009',
    deviceId: 'android-8f2c',
    timestamp: '2026-02-04 09:18:44',
  },
  {
    id: '3',
    eventType: 'VERIFIED',
    mediaId: 'media-0004',
    deviceId: 'android-8f2c',
    timestamp: '2026-02-03 19:03:06',
  },
  {
    id: '4',
    eventType: 'VERIFIED',
    mediaId: 'media-0002',
    deviceId: 'android-8f2c',
    timestamp: '2026-02-03 16:11:29',
  },
];

export default function LogsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={
              colorScheme === 'dark'
                ? ['rgba(34, 198, 217, 0.12)', 'rgba(7, 10, 18, 0)']
                : ['rgba(34, 198, 217, 0.10)', 'rgba(246, 247, 251, 0)']
            }
            start={{ x: 0.15, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.topGlow}
          />
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <SurfaceCard variant="glass" style={styles.heroCard}>
              <View style={styles.heroRow}>
                <View style={[styles.heroIcon, { backgroundColor: theme.surface }]}>
                  <MaterialIcons name="list" size={18} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText type="title" style={{ marginBottom: 2 }}>
                    Audit Logs
                  </ThemedText>
                  <ThemedText style={{ color: theme.mutedText, fontFamily: FontFamilies.medium }}>
                    Verified and blocked attempts, for accountability.
                  </ThemedText>
                </View>
                <Pill tone="neutral" style={styles.filterPill}>
                  <MaterialIcons name="tune" size={15} color={theme.mutedText} />
                </Pill>
              </View>
            </SurfaceCard>
          </View>

          <View style={styles.list}>
            {LOGS.map((item) => {
              const isBlocked = item.eventType === 'BLOCKED';
              const statusColor = isBlocked ? theme.danger : theme.success;
              return (
                <SurfaceCard key={item.id} style={styles.logCard}>
                  <View style={styles.logTopRow}>
                    <Pill tone={isBlocked ? 'danger' : 'success'} style={styles.statusPill}>
                      <MaterialIcons
                        name={isBlocked ? 'block' : 'check-circle'}
                        size={14}
                        color={statusColor}
                      />
                      <ThemedText style={{ fontFamily: FontFamilies.medium, fontSize: 11, color: statusColor }}>
                        {item.eventType}
                      </ThemedText>
                    </Pill>
                    <ThemedText style={{ color: theme.mutedText, fontFamily: FontFamilies.medium, fontSize: 11 }}>
                      {item.timestamp}
                    </ThemedText>
                  </View>

                  <View style={styles.logDetails}>
                    <View style={styles.kvRow}>
                      <ThemedText style={[styles.kLabel, { color: theme.mutedText }]}>Media</ThemedText>
                      <ThemedText style={styles.kValue}>{item.mediaId}</ThemedText>
                    </View>
                    <View style={styles.kvRow}>
                      <ThemedText style={[styles.kLabel, { color: theme.mutedText }]}>Device</ThemedText>
                      <ThemedText style={styles.kValue}>{item.deviceId}</ThemedText>
                    </View>
                  </View>
                </SurfaceCard>
              );
            })}
          </View>
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
    top: -60,
    height: 260,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 110,
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
  filterPill: {
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  list: {
    gap: 10,
  },
  logCard: {
    padding: 12,
  },
  logTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusPill: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  logDetails: {
    marginTop: 10,
    gap: 6,
  },
  kvRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kLabel: {
    fontFamily: FontFamilies.medium,
    fontSize: 11,
  },
  kValue: {
    fontFamily: FontFamilies.semiBold,
    fontSize: 11,
    letterSpacing: 0.2,
  },
});
