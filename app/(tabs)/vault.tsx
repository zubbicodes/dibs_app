import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors, FontFamilies } from '@/constants/theme';
import { useDemoSession } from '@/hooks/demo-session';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';

type VaultCategory = 'all' | 'images' | 'videos' | 'docs' | 'ids';
type VaultItemCategory = Exclude<VaultCategory, 'all'>;

type VaultItem = {
  id: string;
  type: 'image' | 'video';
  category: VaultItemCategory;
  source: { uri: string };
};

const CATEGORY_CARDS: { id: VaultCategory; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { id: 'all', label: 'All', icon: 'grid-view' },
  { id: 'images', label: 'Images', icon: 'image' },
  { id: 'videos', label: 'Videos', icon: 'videocam' },
  { id: 'docs', label: 'Documents', icon: 'description' },
  { id: 'ids', label: 'IDs', icon: 'credit-card' },
];

export default function VaultScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { width } = useWindowDimensions();
  const { isVaultVerified } = useDemoSession();
  const [filter, setFilter] = useState<VaultCategory>('all');
  const [activeItem, setActiveItem] = useState<VaultItem | null>(null);
  const [contentWidth, setContentWidth] = useState<number>(0);

  const items = useMemo<VaultItem[]>(() => {
    const categoryCycle: VaultItemCategory[] = ['images', 'videos', 'docs', 'ids'];
    const imageIds = Array.from({ length: 20 }, (_, index) => 101 + index * 7);
    return imageIds.map((imageId, index) => {
      const category = categoryCycle[index % categoryCycle.length];
      return {
        id: String(index + 1),
        type: category === 'videos' ? 'video' : 'image',
        category,
        source: { uri: `https://yavuzceliker.github.io/sample-images/image-${imageId}.jpg` },
      };
    });
  }, []);

  const filteredItems = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((item) => item.category === filter);
  }, [filter, items]);

  const categoryCounts = useMemo(() => {
    const counts: Record<VaultCategory, number> = {
      all: items.length,
      images: 0,
      videos: 0,
      docs: 0,
      ids: 0,
    };
    items.forEach((item) => {
      counts[item.category] += 1;
    });
    return counts;
  }, [items]);

  const layoutWidth = contentWidth || width;
  const horizontalPadding = 12;
  const gap = 4;
  const availableWidth = Math.max(0, layoutWidth - horizontalPadding * 2);
  const columns = availableWidth < 330 ? 3 : availableWidth < 420 ? 4 : 5;
  const tileSize = Math.max(56, Math.floor((availableWidth - gap * (columns - 1)) / columns));
  const chipGap = 8;

  if (!isVaultVerified) {
    return (
      <ThemedView style={styles.screen}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.lockedWrap}>
            <View style={[styles.lockedIcon, { backgroundColor: theme.surface }]}>
              <MaterialIcons name="lock" size={24} color={theme.primary} />
            </View>
            <ThemedText type="title" style={styles.lockedTitle}>
              Verify to view content
            </ThemedText>
            <ThemedText style={[styles.lockedSubtitle, { color: theme.mutedText }]}>
              Your vault stays hidden until identity verification is complete.
            </ThemedText>
            <Pressable
              onPress={() => router.push('/modal')}
              style={({ pressed }) => [
                styles.verifyButton,
                {
                  backgroundColor: theme.primary,
                  opacity: pressed ? 0.86 : 1,
                },
              ]}>
              <ThemedText style={{ color: '#FFFFFF', fontFamily: FontFamilies.semiBold }}>
                Verify to View Content
              </ThemedText>
            </Pressable>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.content} onLayout={(event) => setContentWidth(event.nativeEvent.layout.width)}>
          <FlatList
            data={filteredItems}
            key={String(columns)}
            numColumns={columns}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: horizontalPadding,
              paddingBottom: 80,
            }}
            columnWrapperStyle={{ gap }}
            ItemSeparatorComponent={() => <View style={{ height: gap }} />}
            ListHeaderComponent={
              <View>
                <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
                  <View style={styles.headerRow}>
                    <ThemedText type="title">Vault</ThemedText>
                    <ThemedText style={{ color: theme.mutedText, fontFamily: FontFamilies.medium }}>
                      {filteredItems.length} items
                    </ThemedText>
                  </View>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[
                    styles.categoryRow,
                    { paddingHorizontal: horizontalPadding, paddingRight: horizontalPadding + 6, gap: chipGap },
                  ]}>
                  {CATEGORY_CARDS.map((category) => {
                    const isActive = filter === category.id;
                    return (
                      <Pressable
                        key={category.id}
                        onPress={() => setFilter(category.id)}
                        style={({ pressed }) => [
                          styles.categoryChip,
                          {
                            borderColor: isActive ? theme.primary : theme.border,
                            backgroundColor: isActive ? theme.primary : theme.surface,
                            opacity: pressed ? 0.8 : 1,
                          },
                        ]}>
                        <MaterialIcons
                          name={category.icon}
                          size={14}
                          color={isActive ? '#FFFFFF' : theme.icon}
                        />
                        <ThemedText
                          style={{
                            fontFamily: FontFamilies.semiBold,
                            fontSize: 12,
                            color: isActive ? '#FFFFFF' : theme.text,
                          }}>
                          {category.label}
                        </ThemedText>
                        <View
                          style={[
                            styles.countPill,
                            {
                              backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : theme.surface2,
                            },
                          ]}>
                          <ThemedText
                            style={{
                              fontSize: 10,
                              color: isActive ? '#FFFFFF' : theme.mutedText,
                              fontFamily: FontFamilies.medium,
                            }}>
                            {categoryCounts[category.id]}
                          </ThemedText>
                        </View>
                      </Pressable>
                    );
                  })}
                </ScrollView>

                <View style={[styles.mediaHeader, { paddingHorizontal: horizontalPadding }]}>
                  <ThemedText type="subtitle">Media</ThemedText>
                  <ThemedText style={{ color: theme.mutedText, fontFamily: FontFamilies.medium }}>
                    {filter === 'all' ? 'All items' : `Filtered by ${filter}`}
                  </ThemedText>
                </View>
              </View>
            }
            renderItem={({ item }) => {
              return (
                <Pressable
                  onPress={() => setActiveItem(item)}
                  style={({ pressed }) => [
                    styles.tile,
                    {
                      width: tileSize,
                      height: tileSize,
                      borderColor: theme.border,
                      opacity: pressed ? 0.9 : 1,
                    },
                  ]}>
                  <Image source={item.source} style={StyleSheet.absoluteFill} contentFit="cover" transition={100} />
                  <View style={[styles.badge, { backgroundColor: theme.surface2, borderColor: theme.border }]}>
                    <MaterialIcons name={item.type === 'video' ? 'videocam' : 'image'} size={12} color={theme.icon} />
                  </View>
                </Pressable>
              );
            }}
          />
        </View>
        <Modal visible={!!activeItem} transparent animationType="fade">
          <View style={styles.viewerBackdrop}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setActiveItem(null)} />
            <View style={styles.viewerCard}>
              <Image
                source={activeItem?.source}
                style={styles.viewerImage}
                contentFit="contain"
                transition={100}
              />
              <Pressable
                onPress={() => setActiveItem(null)}
                style={({ pressed }) => [
                  styles.viewerClose,
                  {
                    backgroundColor: theme.surface,
                    borderColor: theme.border,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}>
                <MaterialIcons name="close" size={18} color={theme.icon} />
              </Pressable>
            </View>
          </View>
        </Modal>
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
  content: {
    flex: 1,
    minWidth: 0,
  },
  header: {
    paddingTop: 4,
    paddingBottom: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryRow: {
    paddingVertical: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  mediaHeader: {
    marginTop: 6,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tile: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
  },
  badge: {
    position: 'absolute',
    right: 6,
    top: 6,
    borderRadius: 10,
    borderWidth: 1,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  lockedWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  lockedIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  lockedTitle: {
    textAlign: 'center',
    marginBottom: 8,
  },
  lockedSubtitle: {
    textAlign: 'center',
    fontSize: 13,
    fontFamily: FontFamilies.medium,
    marginBottom: 18,
  },
  verifyButton: {
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 22,
  },
  viewerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  viewerCard: {
    width: '100%',
    maxWidth: 420,
    aspectRatio: 3 / 4,
    borderRadius: 18,
    overflow: 'hidden',
  },
  viewerImage: {
    width: '100%',
    height: '100%',
  },
  viewerClose: {
    position: 'absolute',
    right: 10,
    top: 10,
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
