import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, FontFamilies } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useViewportDimensions } from '@/hooks/use-viewport-dimensions';
import { ResponsiveWrapper } from '@/components/responsive-wrapper';

import { supabase } from '@/lib/supabase';
import { downloadCsvInBrowser } from '@/lib/web-files';

type LogItem = {
  id: string;
  name: string;
  details: string;
  device: string;
  status: 'verified' | 'blocked';
  type: 'success' | 'danger';
  created_at: string;
};

const DOWNLOAD_FAB_SIZE = 56;
const TAB_BAR_HEIGHT = 76;

function formatLogDetails(details?: string) {
  if (!details) return 'No details provided';
  if (details.includes('Downloaded secured media')) return 'Downloaded media';
  if (details.includes('Device Passcode / Fallback Verified')) return 'PIN Verified Fallback';
  if (details.includes('Device Passcode Verification Failed')) return 'Verification Failed';
  return details;
}

export default function LogsScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const { isMobile, isTablet, isDesktop } = useViewportDimensions();
  const [search, setSearch] = useState('');
  const [logsList, setLogsList] = useState<LogItem[]>([]);

  useFocusEffect(
    useCallback(() => {
      supabase
        .from('logs')
        .select('*')
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (!error && data) {
            setLogsList(data as LogItem[]);
          }
        });
    }, [])
  );

  useEffect(() => {
    const channel = supabase
      .channel('realtime_logs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'logs' },
        (payload) => {
          setLogsList((prev) => [payload.new as LogItem, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const exportLogs = async () => {
    try {
      if (logsList.length === 0) {
        Alert.alert('No Logs', 'There are no logs to export.');
        return;
      }
      
      const header = 'ID,Name,Details,Device,Status,Type,Date\n';
      const rows = logsList.map(log => {
        const safeName = `"${(log.name || '').replace(/"/g, '""')}"`;
        const safeDetails = `"${(log.details || '').replace(/"/g, '""')}"`;
        const safeDevice = `"${(log.device || '').replace(/"/g, '""')}"`;
        const safeDate = `"${new Date(log.created_at || '').toLocaleString().replace(/"/g, '""')}"`;
        
        return `${log.id},${safeName},${safeDetails},${safeDevice},${log.status},${log.type},${safeDate}`;
      }).join('\n');
      
      const csvData = header + rows;
      const fileName = `dibs_audit_logs_${Date.now()}.csv`;

      if (Platform.OS === 'web') {
        downloadCsvInBrowser(csvData, fileName);
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('logs').insert({
          user_id: user?.id,
          name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'System',
          details: 'Exported audit logs archive',
          device: Platform.OS,
          status: 'verified',
          type: 'success',
        });
        return;
      }

      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.writeAsStringAsync(fileUri, csvData, { encoding: FileSystem.EncodingType.UTF8 });
      
      if (Platform.OS === 'android') {
        const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
        if (permissions.granted) {
          const base64Data = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
          const uri = await FileSystem.StorageAccessFramework.createFileAsync(permissions.directoryUri, fileName, 'text/csv');
          await FileSystem.writeAsStringAsync(uri, base64Data, { encoding: FileSystem.EncodingType.Base64 });
          Alert.alert('Download Complete', 'Logs successfully saved to your device.');
          
          const { data: { user } } = await supabase.auth.getUser();
          await supabase.from('logs').insert({
            user_id: user?.id,
            name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'System',
            details: 'Exported audit logs archive',
            device: Platform.OS,
            status: 'verified',
            type: 'success',
          });
        }
      } else {
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: 'Save Audit Logs',
            UTI: 'public.comma-separated-values-text'
          });
          
          const { data: { user } } = await supabase.auth.getUser();
          await supabase.from('logs').insert({
            user_id: user?.id,
            name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'System',
            details: 'Exported audit logs archive',
            device: Platform.OS,
            status: 'verified',
            type: 'success',
          });
        }
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Export Error', 'Failed to generate the `.csv` payload securely.');
    }
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ResponsiveWrapper maxWidth={isDesktop ? 1100 : isTablet ? 800 : 600} style={styles.content}>
          <View style={styles.header}>
            <View style={[styles.headerIcon, { backgroundColor: theme.cardTint }]}>
              <MaterialIcons name="access-time" size={isMobile ? 24 : 32} color={theme.accent} />
            </View>
            <ThemedText style={[styles.headerTitle, { color: theme.text, fontSize: isMobile ? 18 : 24 }]}>Audit & Access Logs</ThemedText>
            <Pressable
              style={[styles.filterButton, { backgroundColor: theme.cardTint, borderColor: theme.cardTintBorder }]}
              onPress={() => {}}
              hitSlop={8}
            >
              <MaterialIcons name="filter-list" size={isMobile ? 18 : 24} color={theme.text} />
            </Pressable>
          </View>

          <View style={[styles.searchWrap, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder }]}>
            <MaterialIcons name="search" size={20} color={theme.mutedText} />
            <TextInput
              placeholder="Search logs..."
              placeholderTextColor={theme.mutedText}
              value={search}
              onChangeText={setSearch}
              style={[styles.searchInput, { color: theme.text }]}
            />
          </View>

          <View style={styles.sectionRow}>
            <ThemedText style={[styles.sectionLabel, { color: theme.text }]}>TODAY</ThemedText>
            <View style={[styles.eventPill, { backgroundColor: theme.cardTint, borderColor: theme.cardTintBorder }]}>
              <ThemedText style={[styles.eventPillText, { color: theme.accent }]}>{logsList.length} Events</ThemedText>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <ScrollView 
            contentContainerStyle={styles.list} 
            showsVerticalScrollIndicator={false}
          >
            {logsList.map((item) => (
              <View
                key={item.id}
                style={[styles.logCard, { backgroundColor: theme.cardTint, borderColor: theme.cardTintBorder }]}>
                <View style={styles.logTopRow}>
                  <View
                    style={[
                      styles.logIcon,
                      { backgroundColor: item.type === 'success' ? 'rgba(57, 198, 149, 0.2)' : 'rgba(239, 68, 68, 0.2)' },
                    ]}>
                    <MaterialIcons
                      name={item.type === 'success' ? 'check-circle' : 'block'}
                      size={24}
                      color={item.type === 'success' ? theme.success : theme.danger}
                    />
                  </View>
                  <ThemedText style={[styles.logName, { color: theme.text, fontSize: isMobile ? 16 : 18 }]}>{item.name}</ThemedText>
                  <View
                    style={[
                      styles.statusButton,
                      item.status === 'verified'
                        ? { backgroundColor: theme.surface, borderColor: theme.border }
                        : { backgroundColor: theme.danger },
                    ]}>
                    <ThemedText
                      style={[
                        styles.statusButtonText,
                        { color: item.status === 'verified' ? theme.text : '#FFF' },
                      ]}>
                      {item.status === 'verified' ? 'Verified' : 'Blocked'}
                    </ThemedText>
                  </View>
                </View>
                <ThemedText style={[styles.logDetails, { color: theme.mutedText, marginLeft: isMobile ? 50 : 60, fontSize: isMobile ? 13 : 15 }]}>
                  {formatLogDetails(item.details)}
                </ThemedText>
                <View style={[styles.deviceTag, { backgroundColor: colorScheme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)', marginLeft: isMobile ? 50 : 60 }]}>
                  <MaterialIcons name="smartphone" size={14} color={theme.mutedText} />
                  <ThemedText style={[styles.deviceText, { color: theme.mutedText }]}>{item.device || 'Unknown Device'}</ThemedText>
                  <View style={styles.timeSpacer} />
                  <ThemedText style={[styles.timeText, { color: theme.mutedText }]}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</ThemedText>
                </View>
              </View>
            ))}
          </ScrollView>
        </ResponsiveWrapper>

        {/* Floating download FAB */}
        <Pressable
          onPress={exportLogs}
          style={({ pressed }) => [
            styles.downloadFab,
            {
              backgroundColor: theme.accent,
              bottom: TAB_BAR_HEIGHT + insets.bottom + 16,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.95 : 1 }]
            },
          ]}
        >
          <MaterialIcons name="download" size={28} color="#FFF" />
        </Pressable>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  content: { flex: 1, paddingTop: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontFamily: FontFamilies.semiBold, lineHeight: 30, flex: 1 },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 16, fontFamily: FontFamilies.regular, paddingVertical: 0 },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionLabel: { fontSize: 14, fontFamily: FontFamilies.medium, letterSpacing: 1 },
  eventPill: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 40,
    borderWidth: 1,
  },
  eventPillText: { fontSize: 10, fontFamily: FontFamilies.medium },
  divider: { height: 1, marginHorizontal: 16, marginBottom: 16, opacity: 0.1 },
  list: { paddingHorizontal: 16, paddingBottom: 140, gap: 16 },
  logCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  logTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  logIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logName: { fontFamily: FontFamilies.medium, flex: 1 },
  statusButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusButtonText: { fontSize: 12, fontFamily: FontFamilies.medium },
  logDetails: { marginBottom: 12 },
  deviceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'stretch',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deviceText: { fontSize: 12 },
  timeSpacer: { flex: 1 },
  timeText: { fontSize: 12, opacity: 0.8 },
  downloadFab: {
    position: 'absolute',
    right: 24,
    width: DOWNLOAD_FAB_SIZE,
    height: DOWNLOAD_FAB_SIZE,
    borderRadius: DOWNLOAD_FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
});
