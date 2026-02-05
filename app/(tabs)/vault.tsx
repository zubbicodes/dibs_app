import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { SurfaceCard } from '@/components/ui/surface-card';
import { Colors, FontFamilies } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';

type VaultCategory = 'all' | 'images' | 'videos' | 'docs' | 'ids';
type VaultItemCategory = Exclude<VaultCategory, 'all'>;

type VaultItem = {
  id: string;
  type: 'image' | 'video';
  category: VaultItemCategory;
  source: number;
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
  const enableLayoutAnimations = process.env.EXPO_OS !== 'web';
  const [filter, setFilter] = useState<VaultCategory>('all');

  const items = useMemo<VaultItem[]>(() => {
    const categoryCycle: VaultItemCategory[] = ['images', 'videos', 'docs', 'ids'];
    return Array.from({ length: 18 }).map((_, index) => {
      const category = categoryCycle[index % categoryCycle.length];
      return {
        id: String(index + 1),
        type: category === 'videos' ? 'video' : 'image',
        category,
        source: require('@/assets/images/react-logo.png'),
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

  const horizontalPadding = 16;
  const gap = 10;
  const tileSize = Math.floor((width - horizontalPadding * 2 - gap) / 2);
  const categoryCardWidth = Math.floor((width - horizontalPadding * 2 - gap) / 2);

  const overlayColor =
    colorScheme === 'dark' ? 'rgba(10, 16, 28, 0.48)' : 'rgba(255, 255, 255, 0.32)';
  const overlayBorder =
    colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(10, 46, 101, 0.08)';

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <LinearGradient
            colors={
              colorScheme === 'dark'
                ? ['rgba(34, 198, 217, 0.14)', 'rgba(7, 10, 18, 0)']
                : ['rgba(34, 198, 217, 0.12)', 'rgba(246, 247, 251, 0)']
            }
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.topGlow}
          />
        </View>
        <FlatList
          data={filteredItems}
          numColumns={2}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: horizontalPadding,
            paddingBottom: 110,
          }}
          columnWrapperStyle={{ gap }}
          ItemSeparatorComponent={() => <View style={{ height: gap }} />}
          ListHeaderComponent={
            <View>
              <Animated.View
                style={[styles.header, { paddingHorizontal: horizontalPadding }]}
                {...(enableLayoutAnimations ? { entering: FadeInDown.duration(240) } : {})}>
                <SurfaceCard variant="glass" style={styles.heroCard}>
                  <View style={styles.heroTopRow}>
                    <View style={[styles.heroIcon, { backgroundColor: theme.surface }]}>
                      <MaterialIcons name="lock" size={18} color={theme.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <ThemedText type="title" style={{ marginBottom: 2 }}>
                        Media Vault
                      </ThemedText>
                      <ThemedText style={{ color: theme.mutedText, fontFamily: FontFamilies.medium }}>
                        Verify identity to unlock protected items.
                      </ThemedText>
                    </View>
                  </View>
                </SurfaceCard>
              </Animated.View>

              <View style={[styles.categoriesWrap, { paddingHorizontal: horizontalPadding }]}>
                <View style={styles.sectionHeader}>
                  <ThemedText type="subtitle">Categories</ThemedText>
                  <ThemedText style={{ color: theme.mutedText, fontFamily: FontFamilies.medium, fontSize: 12 }}>
                    {items.length} total
                  </ThemedText>
                </View>
                <View style={styles.categoryGrid}>
                  {CATEGORY_CARDS.map((category) => {
                    const isActive = filter === category.id;
                    return (
                      <Pressable
                        key={category.id}
                        onPress={() => setFilter(category.id)}
                        style={({ pressed }) => [
                          { width: categoryCardWidth },
                          { opacity: pressed ? 0.9 : 1 },
                        ]}>
                        <SurfaceCard
                          style={[
                            styles.categoryCard,
                            { width: '100%' },
                            isActive ? { borderColor: theme.primary } : null,
                          ]}>
                          <View style={[styles.categoryIcon, { backgroundColor: theme.surface }]}>
                            <MaterialIcons
                              name={category.icon}
                              size={16}
                              color={isActive ? theme.primary : theme.icon}
                            />
                          </View>
                          <View style={styles.categoryMeta}>
                            <ThemedText numberOfLines={1} style={{ fontFamily: FontFamilies.semiBold, fontSize: 13 }}>
                              {category.label}
                            </ThemedText>
                            <ThemedText style={{ color: theme.mutedText, fontSize: 11 }}>
                              {categoryCounts[category.id]} items
                            </ThemedText>
                          </View>
                        </SurfaceCard>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View style={[styles.mediaHeader, { paddingHorizontal: horizontalPadding }]}>
                <ThemedText type="subtitle">All Media</ThemedText>
                <ThemedText style={{ color: theme.mutedText, fontFamily: FontFamilies.medium }}>
                  {filteredItems.length} shown
                </ThemedText>
              </View>
            </View>
          }
          renderItem={({ item }) => {
            return (
              <Pressable
                onPress={() => router.push({ pathname: '/modal', params: { mediaId: item.id } })}
                style={({ pressed }) => [
                  styles.tile,
                  {
                    width: tileSize,
                    height: tileSize,
                    borderColor: theme.border,
                    opacity: pressed ? 0.88 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  },
                ]}>
                <Image
                  source={item.source}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={100}
                  blurRadius={16}
                />

                <View
                  style={[
                    StyleSheet.absoluteFill,
                    styles.frostOverlay,
                    { backgroundColor: overlayColor, borderColor: overlayBorder },
                  ]}
                />

                <View style={styles.lockCenter}>
                  <MaterialIcons name="lock" size={20} color={theme.primary} />
                  <ThemedText style={[styles.lockLabel, { color: theme.primary }]}>Locked</ThemedText>
                </View>

                {item.type === 'video' ? (
                  <View style={[styles.badge, { backgroundColor: overlayColor, borderColor: overlayBorder }]}>
                    <MaterialIcons name="videocam" size={14} color={theme.primary} />
                  </View>
                ) : null}
              </Pressable>
            );
          }}
        />
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
    top: -50,
    height: 260,
  },
  header: {
    paddingTop: 6,
    paddingBottom: 14,
  },
  heroCard: {
    padding: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoriesWrap: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 8,
    rowGap: 8,
  },
  categoryCard: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    minHeight: 72,
  },
  categoryIcon: {
    width: 30,
    height: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryMeta: {
    gap: 2,
  },
  mediaHeader: {
    marginTop: 10,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tile: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  frostOverlay: {
    borderWidth: 1,
  },
  lockCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  lockLabel: {
    fontSize: 11,
    fontFamily: FontFamilies.semiBold,
    letterSpacing: 0.3,
  },
  badge: {
    position: 'absolute',
    right: 8,
    top: 8,
    borderRadius: 10,
    borderWidth: 1,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
