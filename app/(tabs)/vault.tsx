import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useViewportDimensions } from '@/hooks/use-viewport-dimensions';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, FontFamilies } from '@/constants/theme';
import { useDemoSession } from '@/hooks/demo-session';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/hooks/use-auth';
import { WatermarkOverlay } from '@/components/watermark-overlay';
import { supabase } from '@/lib/supabase';

type Filter = 'all' | 'photos' | 'videos';
type VaultItem = { id: string; uri: string; type: 'image' | 'video' };

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'photos', label: 'Photos' },
  { id: 'videos', label: 'Videos' },
];

export default function VaultScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { width, isMobile, isTablet } = useViewportDimensions();
  const insets = useSafeAreaInsets();
  const { isVaultVerified } = useDemoSession();
  const [filter, setFilter] = useState<Filter>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionItem, setActionItem] = useState<VaultItem | null>(null);
  const [busy, setBusy] = useState(false);

  const { user } = useAuth();

  const padding = 16;
  const gap = 10;
  const cols = isMobile ? 3 : isTablet ? 4 : 5;
  const containerWidth = isMobile ? width : Math.min(width, 1000);
  const tileWidth = (containerWidth - padding * 2 - gap * (cols - 1)) / cols;

  const [items, setItems] = useState<VaultItem[]>([]);

  const loadVault = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase.storage.from('vault').list(user.id);
    if (error || !data) return;

    const fileNames = data
      .filter((f) => f.name !== '.emptyFolderPlaceholder')
      .map((f) => `${user.id}/${f.name}`);
    if (fileNames.length === 0) {
      setItems([]);
      return;
    }

    const { data: signedUrls } = await supabase.storage
      .from('vault')
      .createSignedUrls(fileNames, 60 * 60);

    if (signedUrls) {
      const out = signedUrls.map((s, i) => {
        const fileName = fileNames[i];
        const isVid = /\.(mp4|mov|avi|mkv|webm)$/i.test(fileName);
        return {
          id: fileName,
          uri: s.signedUrl || '',
          type: (isVid ? 'video' : 'image') as 'image' | 'video',
        };
      });
      setItems(out);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadVault();
    }, [loadVault])
  );

  const filtered = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((i) => i.type === (filter === 'photos' ? 'image' : 'video'));
  }, [filter, items]);

  const photoCount = useMemo(() => items.filter((i) => i.type === 'image').length, [items]);
  const videoCount = useMemo(() => items.filter((i) => i.type === 'video').length, [items]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadVault();
    setIsRefreshing(false);
  }, [loadVault]);

  const openActions = useCallback((item: VaultItem) => {
    if (Platform.OS !== 'web') {
      void Haptics.selectionAsync();
    }
    setActionItem(item);
  }, []);

  const closeActions = useCallback(() => {
    if (!busy) setActionItem(null);
  }, [busy]);

  const handleDownload = useCallback(async () => {
    if (!actionItem) return;
    setBusy(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant media library access to save files.');
        return;
      }

      const parsedUrl = new URL(actionItem.uri);
      const filename = parsedUrl.pathname.split('/').pop() || `download_${Date.now()}`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      const downloadRes = await FileSystem.downloadAsync(actionItem.uri, fileUri);

      const asset = await MediaLibrary.createAssetAsync(downloadRes.uri);
      const album = await MediaLibrary.getAlbumAsync('DIBS');
      if (album == null) {
        await MediaLibrary.createAlbumAsync('DIBS', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }

      void supabase.from('logs').insert({
        user_id: user?.id,
        name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
        details: 'Downloaded media',
        device: Platform.OS,
        status: 'verified',
        type: 'success',
      });

      Alert.alert('Saved', 'Media saved to your DIBS gallery.');
      setActionItem(null);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to download media.');
    } finally {
      setBusy(false);
    }
  }, [actionItem, user]);

  const handleShare = useCallback(async () => {
    if (!actionItem) return;
    setBusy(true);
    try {
      const isAvailable = await Sharing.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Unavailable', 'Sharing is not available on this device.');
        return;
      }

      const parsedUrl = new URL(actionItem.uri);
      const filename = parsedUrl.pathname.split('/').pop() || `share_${Date.now()}`;
      const fileUri = `${FileSystem.cacheDirectory}${filename}`;
      const downloadRes = await FileSystem.downloadAsync(actionItem.uri, fileUri);

      await Sharing.shareAsync(downloadRes.uri, {
        dialogTitle: 'Share from DIBS',
        mimeType: actionItem.type === 'video' ? 'video/*' : 'image/*',
      });
      setActionItem(null);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to share media.');
    } finally {
      setBusy(false);
    }
  }, [actionItem]);

  const handleDelete = useCallback(() => {
    if (!actionItem) return;
    const toDelete = actionItem;
    Alert.alert(
      'Delete media',
      'This file will be permanently removed from your vault.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              const { error } = await supabase.storage.from('vault').remove([toDelete.id]);
              if (error) throw error;
              setItems((prev) => prev.filter((x) => x.id !== toDelete.id));

              void supabase.from('logs').insert({
                user_id: user?.id,
                name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
                details: 'Deleted media from vault',
                device: Platform.OS,
                status: 'verified',
                type: 'success',
              });

              setActionItem(null);
            } catch (e) {
              console.error(e);
              Alert.alert('Error', 'Failed to delete media.');
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  }, [actionItem, user]);

  const handleView = useCallback(() => {
    if (!actionItem) return;
    const target = actionItem;
    setActionItem(null);
    router.push({ pathname: '/viewer', params: { url: target.uri, type: target.type } });
  }, [actionItem, router]);

  if (!isVaultVerified) {
    return (
      <ThemedView style={styles.screen}>
        <View style={styles.lockedOverlay} />
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.lockedWrap}>
            <LinearGradient
              colors={theme.blueGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.lockedCard, !isMobile && { width: 400, paddingVertical: 40 }]}>
              <View style={styles.lockedIconWrap}>
                <MaterialIcons name="lock" size={32} color="#FFF" />
              </View>
              <ThemedText style={[styles.lockedTitle, !isMobile && { fontSize: 24 }]}>
                Verify to view content
              </ThemedText>
              <ThemedText style={[styles.lockedSubtitle, !isMobile && { fontSize: 16 }]}>
                Your vault stays hidden until identity verification is complete.
              </ThemedText>
              <Pressable
                onPress={() => router.push('/modal')}
                style={({ pressed }) => [
                  styles.verifyButton,
                  { backgroundColor: theme.primary, opacity: pressed ? 0.9 : 1 },
                  !isMobile && { width: 300, height: 54 },
                ]}>
                <ThemedText
                  style={[styles.verifyButtonText, !isMobile && { fontSize: 16 }]}>
                  Verify Identity
                </ThemedText>
              </Pressable>
            </LinearGradient>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  const headerBg =
    colorScheme === 'dark' ? 'rgba(7, 10, 18, 0.96)' : 'rgba(247, 248, 251, 0.96)';
  const headerBorder =
    colorScheme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(15,26,43,0.06)';

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        {/* Sticky header + filters */}
        <View
          style={[
            styles.stickyHeader,
            { backgroundColor: headerBg, borderBottomColor: headerBorder },
          ]}>
          <View
            style={[
              styles.headerInner,
              !isMobile && { maxWidth: 1000, alignSelf: 'center', width: '100%' },
            ]}>
            <View style={styles.header}>
              <View style={[styles.headerIcon, { backgroundColor: theme.cardTint }]}>
                <MaterialIcons name="lock" size={22} color={theme.accent} />
              </View>
              <View style={styles.headerText}>
                <ThemedText
                  style={[
                    styles.headerTitle,
                    { color: theme.text, fontSize: isMobile ? 18 : 22 },
                  ]}>
                  Media Vault
                </ThemedText>
                <ThemedText style={[styles.headerSubtitle, { color: theme.mutedText }]}>
                  {photoCount} photo{photoCount === 1 ? '' : 's'} · {videoCount} video
                  {videoCount === 1 ? '' : 's'}
                </ThemedText>
              </View>
            </View>

            <View style={styles.filterRow}>
              {FILTERS.map((f) => {
                const isActive = filter === f.id;
                return (
                  <Pressable
                    key={f.id}
                    onPress={() => setFilter(f.id)}
                    style={({ pressed }) => [
                      styles.filterChip,
                      {
                        backgroundColor: isActive
                          ? colorScheme === 'dark'
                            ? theme.cardTint
                            : theme.surface2
                          : 'transparent',
                        borderColor: isActive ? theme.accent : theme.cardTintBorder,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}>
                    {f.id === 'photos' && (
                      <MaterialIcons
                        name="image"
                        size={14}
                        color={isActive ? theme.accent : theme.mutedText}
                      />
                    )}
                    {f.id === 'videos' && (
                      <MaterialIcons
                        name="videocam"
                        size={14}
                        color={isActive ? theme.accent : theme.mutedText}
                      />
                    )}
                    <ThemedText
                      style={[
                        styles.filterLabel,
                        {
                          color: isActive ? theme.text : theme.mutedText,
                          fontFamily: isActive ? FontFamilies.medium : FontFamilies.regular,
                        },
                      ]}>
                      {f.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Grid */}
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.emptyIconWrap,
                { backgroundColor: theme.cardTint, borderColor: theme.cardTintBorder },
              ]}>
              <MaterialIcons name="photo-library" size={36} color={theme.accent} />
            </View>
            <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
              Your vault is empty
            </ThemedText>
            <ThemedText style={[styles.emptySubtitle, { color: theme.mutedText }]}>
              Protected media you save will appear here.
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={filtered}
            numColumns={cols}
            key={cols}
            keyExtractor={(item) => item.id}
            style={styles.grid}
            contentContainerStyle={[
              styles.gridContent,
              {
                alignSelf: isMobile ? 'stretch' : 'center',
                width: containerWidth,
                paddingBottom: 100 + insets.bottom,
              },
            ]}
            columnWrapperStyle={cols > 1 ? { gap, marginBottom: gap } : undefined}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
                tintColor={theme.accent}
                colors={[theme.accent]}
                progressBackgroundColor={colorScheme === 'dark' ? '#1a2236' : '#FFFFFF'}
              />
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: '/viewer',
                    params: { url: item.uri, type: item.type },
                  })
                }
                onLongPress={() => openActions(item)}
                delayLongPress={220}
                style={({ pressed }) => [
                  styles.tile,
                  {
                    width: tileWidth,
                    backgroundColor: theme.cardTint,
                    borderColor: theme.cardTintBorder,
                    opacity: pressed ? 0.88 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}>
                <Image
                  source={{ uri: item.uri }}
                  style={styles.tileImage}
                  contentFit="cover"
                  transition={180}
                  cachePolicy="memory-disk"
                />
                {item.type === 'video' && (
                  <View style={styles.videoBadge}>
                    <MaterialIcons name="play-arrow" size={14} color="#FFF" />
                  </View>
                )}
                <WatermarkOverlay size={80} />
              </Pressable>
            )}
          />
        )}
      </SafeAreaView>

      {/* Action sheet */}
      <Modal
        visible={actionItem !== null}
        transparent
        animationType="fade"
        onRequestClose={closeActions}
        statusBarTranslucent>
        <Pressable style={styles.sheetBackdrop} onPress={closeActions}>
          <Pressable
            style={[
              styles.sheet,
              {
                backgroundColor: colorScheme === 'dark' ? '#121826' : '#FFFFFF',
                paddingBottom: 16 + insets.bottom,
                borderColor: theme.border,
              },
            ]}
            onPress={(e) => e.stopPropagation()}>
            <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
            <ThemedText style={[styles.sheetTitle, { color: theme.text }]}>
              {actionItem?.type === 'video' ? 'Video options' : 'Photo options'}
            </ThemedText>

            <SheetAction
              icon="visibility"
              label="View"
              theme={theme}
              onPress={handleView}
              disabled={busy}
            />
            <SheetAction
              icon="file-download"
              label="Download to gallery"
              theme={theme}
              onPress={handleDownload}
              disabled={busy}
            />
            <SheetAction
              icon="share"
              label="Share"
              theme={theme}
              onPress={handleShare}
              disabled={busy}
            />
            <SheetAction
              icon="delete"
              label="Delete"
              theme={theme}
              destructive
              onPress={handleDelete}
              disabled={busy}
            />

            {busy && (
              <View style={styles.sheetBusy}>
                <ActivityIndicator color={theme.accent} />
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </ThemedView>
  );
}

function SheetAction({
  icon,
  label,
  onPress,
  theme,
  destructive,
  disabled,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
  theme: typeof Colors.light;
  destructive?: boolean;
  disabled?: boolean;
}) {
  const color = destructive ? theme.danger : theme.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.sheetRow,
        { opacity: pressed || disabled ? 0.6 : 1 },
      ]}>
      <MaterialIcons name={icon} size={22} color={color} />
      <ThemedText style={[styles.sheetRowLabel, { color }]}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safeArea: { flex: 1 },
  lockedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 10, 18, 0.85)',
  },
  lockedWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  lockedCard: {
    borderRadius: 18,
    paddingHorizontal: 26,
    paddingTop: 24,
    paddingBottom: 24,
    alignItems: 'center',
  },
  lockedIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  lockedTitle: {
    fontFamily: FontFamilies.semiBold,
    textAlign: 'center',
    color: '#FFF',
    marginBottom: 12,
  },
  lockedSubtitle: {
    textAlign: 'center',
    lineHeight: 22,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 24,
  },
  verifyButton: {
    width: 230,
    height: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonText: { color: '#FFF', fontFamily: FontFamilies.semiBold },
  stickyHeader: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerInner: {
    paddingTop: 4,
    paddingBottom: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  headerTitle: { fontFamily: FontFamilies.semiBold },
  headerSubtitle: { fontSize: 12, opacity: 0.8, marginTop: 2 },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 40,
    borderWidth: 1,
  },
  filterLabel: { fontSize: 12 },
  grid: { flex: 1 },
  gridContent: { paddingHorizontal: 16, paddingTop: 12 },
  tile: {
    borderRadius: 12,
    overflow: 'hidden',
    aspectRatio: 1,
    borderWidth: 1,
  },
  tileImage: { width: '100%', height: '100%' },
  videoBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: FontFamilies.semiBold,
    fontSize: 18,
    marginTop: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingHorizontal: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetTitle: {
    fontFamily: FontFamilies.semiBold,
    fontSize: 16,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  sheetRowLabel: { fontFamily: FontFamilies.medium, fontSize: 15 },
  sheetBusy: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
});
