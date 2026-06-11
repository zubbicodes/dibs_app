import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import { usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';

import { DibsLogo } from '@/components/dibs-logo';
import { ThemedText } from '@/components/themed-text';
import { Colors, FontFamilies } from '@/constants/theme';
import { useDemoSession } from '@/hooks/demo-session';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { supabase } from '@/lib/supabase';

const NAV_ITEMS = [
  { label: 'Home', path: '/(tabs)' as const, match: '/(tabs)', icon: 'home' as const },
  { label: 'Vault', path: '/(tabs)/vault' as const, match: '/vault', icon: 'lock' as const },
  { label: 'Logs', path: '/(tabs)/logs' as const, match: '/logs', icon: 'access-time' as const },
  { label: 'Settings', path: '/(tabs)/settings' as const, match: '/settings', icon: 'settings' as const },
];

export function WebSidebarNav() {
  const router = useRouter();
  const pathname = usePathname();
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];
  const { user, signOut } = useAuth();
  const { isVaultVerified, resetVaultVerification } = useDemoSession();
  const [isUploading, setIsUploading] = useState(false);

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';

  const handleUpload = async () => {
    if (!user?.id || isUploading) return;
    if (!isVaultVerified) {
      router.push('/modal');
      return;
    }

    try {
      setIsUploading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images', 'videos'],
        allowsEditing: false,
        quality: 1,
      });

      if (result.canceled || result.assets.length === 0) return;

      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const inferredExt = asset.fileName?.split('.').pop() || asset.uri.split('.').pop() || (asset.type === 'video' ? 'mp4' : 'jpg');
      const fileExt = inferredExt.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() || 'jpg';
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;
      const contentType = asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg');

      const { error } = await supabase.storage.from('vault').upload(filePath, blob, { contentType });
      if (error) throw error;

      await supabase.from('logs').insert({
        user_id: user.id,
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        details: `Uploaded media file: ${fileExt.toUpperCase()}`,
        device: Platform.OS,
        status: 'verified',
        type: 'success',
      });

      router.push('/(tabs)/vault');
    } catch (error) {
      console.error('Web upload failed:', error);
      if (typeof window !== 'undefined') {
        window.alert('Failed to upload media.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View
      style={[
        styles.sidebar,
        {
          backgroundColor: colorScheme === 'dark' ? '#0B101C' : theme.surface,
          borderRightColor: theme.border,
        },
      ]}>
      <View style={styles.brand}>
        <DibsLogo width={124} height={48} />
        <ThemedText style={[styles.brandText, { color: theme.mutedText }]}>Secure media vault</ThemedText>
      </View>

      <View style={styles.navList}>
        {NAV_ITEMS.map((item) => {
          const active = item.match === '/(tabs)' ? pathname === '/' || pathname === '/(tabs)' : pathname.includes(item.match);
          return (
            <Pressable
              key={item.label}
              onPress={() => {
                if (item.match !== '/vault') resetVaultVerification();
                router.push(item.path);
              }}
              style={({ pressed }) => [
                styles.navItem,
                {
                  backgroundColor: active ? theme.cardTint : 'transparent',
                  borderColor: active ? theme.cardTintBorder : 'transparent',
                  opacity: pressed ? 0.82 : 1,
                },
              ]}>
              <MaterialIcons name={item.icon} size={22} color={active ? theme.accent : theme.mutedText} />
              <ThemedText style={[styles.navLabel, { color: active ? theme.text : theme.mutedText }]}>
                {item.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        onPress={handleUpload}
        disabled={isUploading}
        style={({ pressed }) => [
          styles.uploadButton,
          { backgroundColor: theme.primary, opacity: pressed || isUploading ? 0.84 : 1 },
        ]}>
        {isUploading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <>
            <MaterialIcons name="add" size={22} color="#FFF" />
            <ThemedText style={styles.uploadText}>Upload Media</ThemedText>
          </>
        )}
      </Pressable>

      <Pressable
        onPress={() => router.push('/notifications')}
        style={({ pressed }) => [
          styles.secondaryAction,
          { borderColor: theme.border, opacity: pressed ? 0.82 : 1 },
        ]}>
        <MaterialIcons name="notifications" size={20} color={theme.mutedText} />
        <ThemedText style={[styles.secondaryText, { color: theme.text }]}>Notifications</ThemedText>
      </Pressable>

      <View style={[styles.account, { borderTopColor: theme.border }]}>
        <View style={styles.accountText}>
          <ThemedText numberOfLines={1} style={[styles.accountName, { color: theme.text }]}>
            {userName}
          </ThemedText>
          <ThemedText numberOfLines={1} style={[styles.accountEmail, { color: theme.mutedText }]}>
            {userEmail}
          </ThemedText>
        </View>
        <Pressable
          onPress={async () => {
            await signOut();
            router.replace('/(auth)/login');
          }}
          style={({ pressed }) => [styles.logoutIcon, { opacity: pressed ? 0.7 : 1 }]}
          accessibilityLabel="Log out">
          <MaterialIcons name="logout" size={20} color={theme.danger} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 284,
    borderRightWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 28,
    paddingBottom: 18,
    gap: 18,
  },
  brand: {
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  brandText: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: FontFamilies.medium,
  },
  navList: {
    gap: 8,
  },
  navItem: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  navLabel: {
    fontSize: 14,
    fontFamily: FontFamilies.medium,
  },
  uploadButton: {
    height: 48,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  uploadText: {
    color: '#FFF',
    fontFamily: FontFamilies.semiBold,
    fontSize: 14,
  },
  secondaryAction: {
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  secondaryText: {
    fontFamily: FontFamilies.medium,
    fontSize: 13,
  },
  account: {
    marginTop: 'auto',
    borderTopWidth: 1,
    paddingTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accountText: {
    flex: 1,
    minWidth: 0,
  },
  accountName: {
    fontFamily: FontFamilies.semiBold,
    fontSize: 14,
  },
  accountEmail: {
    fontFamily: FontFamilies.regular,
    fontSize: 12,
    marginTop: 2,
  },
  logoutIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
