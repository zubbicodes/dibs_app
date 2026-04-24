import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Platform, Pressable, StyleSheet, View, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { WatermarkOverlay } from '@/components/watermark-overlay';

export default function ViewerScreen() {
  const router = useRouter();
  const { url, type } = useLocalSearchParams<{ url: string; type: string }>();
  const [isDownloading, setIsDownloading] = useState(false);
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];

  const handleDownload = async () => {
    if (!url) return;
    setIsDownloading(true);
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status !== 'granted') {
        alert('Permission to access media library is required to save files to your gallery.');
        setIsDownloading(false);
        return;
      }

      const parsedUrl = new URL(url);
      const filename = parsedUrl.pathname.split('/').pop() || `download_${Date.now()}`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      const downloadRes = await FileSystem.downloadAsync(url, fileUri);
      
      const asset = await MediaLibrary.createAssetAsync(downloadRes.uri);
      const album = await MediaLibrary.getAlbumAsync('DIBS');
      if (album == null) {
        await MediaLibrary.createAlbumAsync('DIBS', asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }
      
      await supabase.from('logs').insert({
        user_id: user?.id,
        name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
        details: `Downloaded media`,
        device: Platform.OS,
        status: 'verified',
        type: 'success',
      });

      alert('Successfully saved to DIBS gallery!');
    } catch (e) {
      console.error(e);
      alert('Failed to process secure payload.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.iconButton}>
          <MaterialIcons name="close" size={28} color="#FFF" />
        </Pressable>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {type === 'video' ? (
          <Video
            source={{ uri: url || '' }}
            style={styles.media}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            isLooping
          />
        ) : (
          <Image
            source={{ uri: url || '' }}
            style={styles.media}
            contentFit="contain"
          />
        )}
        <WatermarkOverlay size={200} />
      </View>

      {/* Footer FAB */}
      <Pressable onPress={handleDownload} disabled={isDownloading} style={[styles.fab, { backgroundColor: theme.primary }]}>
        {isDownloading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <MaterialIcons name="download" size={28} color="#FFF" />
        )}
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 40,
    right: 16,
    zIndex: 10,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  media: {
    width: '100%',
    height: '100%',
  },
  fab: {
    position: 'absolute',
    bottom: 40,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 20,
  },
});
