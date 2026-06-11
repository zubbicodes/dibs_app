import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Colors, FontFamilies } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useViewportDimensions } from '@/hooks/use-viewport-dimensions';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { useDemoSession } from '@/hooks/demo-session';

const TABS = [
  { name: 'index', label: 'Home', icon: 'home' as const },
  { name: 'vault', label: 'Vault', icon: 'lock' as const },
  { name: 'logs', label: 'Logs', icon: 'access-time' as const },
  { name: 'settings', label: 'Settings', icon: 'settings' as const },
];

// Pencil design: Prkcx (bar 375×64), aX8Lv (FAB 68, stroke 11), tab groups at x 16, 87, 262, 313
const DESIGN_WIDTH = 375;
const BAR_HEIGHT = 64;
const FAB_SIZE = 68;
// Tab center X from Pencil (group x + width/2): 16+17.5, 87+15, 262+13.5, 313+23
const TAB_CENTER_RATIOS = [33.5 / DESIGN_WIDTH, 102 / DESIGN_WIDTH, 275.5 / DESIGN_WIDTH, 336 / DESIGN_WIDTH];

const FAB_SLOT_BOTTOM = BAR_HEIGHT - FAB_SIZE / 2;
const TAB_INACTIVE_OPACITY = 0.3;

const TAB_BUTTON_WIDTH = 52;
const TAB_BUTTON_WIDTH_SETTINGS = 58;

export function FloatingTabBar({ state, navigation }: any) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: screenWidth } = useViewportDimensions();
  const bottomPadding = Math.max(insets.bottom, 12);

  const tabColor = theme.tabIconSelected ?? theme.accent;
  const fabFill = theme.primary;
  const { user } = useAuth();
  const { isVaultVerified, resetVaultVerification } = useDemoSession();
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!user?.id) return;
    if (!isVaultVerified) {
      router.push('/modal');
      return;
    }
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        quality: 1,
        base64: true, // returns base64 for images
      });

      if (!result.canceled && result.assets.length > 0) {
        setIsUploading(true);
        const asset = result.assets[0];
        
        let fileExt = asset.fileName?.split('.').pop() || asset.uri.split('.').pop() || 'jpg';
        if (asset.type === 'video' && !fileExt.match(/(mp4|mov|avi)/i)) fileExt = 'mp4';
        
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;
        const contentType = asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg');

        if (Platform.OS === 'web') {
          const response = await fetch(asset.uri);
          const blob = await response.blob();
          await supabase.storage.from('vault').upload(filePath, blob, { contentType });
        } else {
          let base64Str = asset.base64;
          // Videos don't return base64 from picker automatically in Expo, fetch it via FS:
          if (!base64Str) {
            base64Str = await FileSystem.readAsStringAsync(asset.uri, {
              encoding: 'base64',
            });
          }
          
          if (!base64Str) throw new Error('Could not parse media bytes');
          await supabase.storage.from('vault').upload(filePath, decode(base64Str), { contentType });
        }

        await supabase.from('logs').insert({
          user_id: user.id,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
          details: `Uploaded media file: ${fileExt.toUpperCase()}`,
          device: Platform.OS,
          status: 'verified',
          type: 'success',
        });
        
        // Navigation forces a vault reload
        router.push('/(tabs)/vault');
      }
    } catch (err) {
      console.error('Upload Error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={[styles.tabBarContainer, { width: screenWidth }]}>
        <Image
          source={
            colorScheme === 'dark'
              ? require('@/assets/images/nav_dark.png')
              : require('@/assets/images/nav_light.png')
          }
          style={[StyleSheet.absoluteFill, { width: screenWidth, height: BAR_HEIGHT }]}
          resizeMode="stretch"
        />
        <View style={styles.tabBarContent}>
          {TABS.map((tab, index) => {
            const route = state.routes.find((r: any) => r.name === tab.name) ?? state.routes[index];
            const routeIndex = state.routes.findIndex((r: any) => r.name === tab.name);
            const isFocused = routeIndex >= 0 ? state.index === routeIndex : state.index === index;
            const btnWidth = index === 3 ? TAB_BUTTON_WIDTH_SETTINGS : TAB_BUTTON_WIDTH;
            const centerX = screenWidth * TAB_CENTER_RATIOS[index];
            const left = centerX - btnWidth / 2;

            const onPress = () => {
              if (tab.name !== 'vault') {
                resetVaultVerification();
              }

              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(tab.name);
              }
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={[
                  styles.tabButton,
                  { left, width: btnWidth, opacity: isFocused ? 1 : TAB_INACTIVE_OPACITY },
                ]}
                accessibilityRole="tab"
                accessibilityState={isFocused ? { selected: true } : {}}>
                <MaterialIcons
                  name={tab.icon}
                  size={26}
                  color={tabColor}
                />
                <ThemedText
                  numberOfLines={1}
                  style={[
                    styles.tabLabel,
                    {
                      color: tabColor,
                      fontFamily: isFocused ? FontFamilies.medium : FontFamilies.regular,
                    },
                  ]}>
                  {tab.label}
                </ThemedText>
              </Pressable>
            );
          })}
          <View style={[styles.fabSlot, { marginLeft: -FAB_SIZE / 2 }]}>
            <Pressable
              onPress={handleUpload}
              disabled={isUploading}
              style={({ pressed }) => [
                styles.fab,
                { backgroundColor: fabFill, opacity: pressed || isUploading ? 0.8 : 1 },
              ]}>
              {isUploading ? (
                <MaterialIcons name="hourglass-empty" size={24} color="#FFF" />
              ) : (
                <ThemedText style={styles.fabIcon}>+</ThemedText>
              )}
            </Pressable>
          </View>
        </View>
      </View>
      <View
        style={[
          styles.gestureBlock,
          {
            height: bottomPadding,
            backgroundColor: theme.background,
            width: screenWidth,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
    elevation: 10,
  },
  gestureBlock: {
    alignSelf: 'stretch',
  },
  tabBarContainer: {
    height: BAR_HEIGHT,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  tabBarContent: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingBottom: 8,
    paddingTop: 12,
  },
  tabButton: {
    position: 'absolute',
    width: TAB_BUTTON_WIDTH,
    bottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabLabel: {
    fontSize: 12,
    overflow: 'hidden',
  },
  fabSlot: {
    position: 'absolute',
    bottom: FAB_SLOT_BOTTOM,
    left: '50%',
    width: FAB_SIZE,
    height: FAB_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: {
    color: '#FFFFFF',
    fontSize: 28,
    fontFamily: FontFamilies.medium,
    lineHeight: 32,
  },
});
