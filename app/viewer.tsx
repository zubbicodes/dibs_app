import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ResizeMode, Video } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { Image } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Platform, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Camera,
  runAtTargetFps,
  useCameraDevice,
  useCameraPermission,
  useFrameProcessor,
  type CameraRuntimeError,
  Worklets,
  useResizePlugin,
} from '@/lib/native-camera';

import { PhoneDetectorOverlay } from '@/components/phone-detector-overlay';
import { WatermarkOverlay } from '@/components/watermark-overlay';
import { PHONE_DETECTION_FPS } from '@/constants/detection';
import { Colors } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { usePhoneDetectionModel } from '@/hooks/use-phone-detection-model';
import { usePhoneDetection } from '@/hooks/use-phone-detector';
import { logPhoneDetectionEvent } from '@/lib/phone-detection-logger';
import { MODEL_INPUT_SIZE, emptyPhoneDetectionResult, parsePhoneDetectionOutputs } from '@/lib/phone-detector';
import { supabase } from '@/lib/supabase';
import { downloadUrlInBrowser, getFilenameFromUrl } from '@/lib/web-files';

const DETECTOR_CAMERA_START_DELAY_MS = 800;

export default function ViewerScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { url, type } = useLocalSearchParams<{ url: string; type: string }>();
  const [isDownloading, setIsDownloading] = useState(false);
  const { user } = useAuth();
  const colorScheme = useColorScheme() ?? 'dark';
  const theme = Colors[colorScheme];
  const { hasPermission, requestPermission } = useCameraPermission();
  const cameraRef = useRef<Camera>(null);
  const {
    updateDetectionState,
    isExternalDeviceDetected,
    confidence,
    resetDetection,
  } = usePhoneDetection();
  const {
    boxedModel,
    error: phoneDetectionModelError,
  } = usePhoneDetectionModel();
  const { resize } = useResizePlugin();
  const device = useCameraDevice('front');
  const [appState, setAppState] = useState(AppState.currentState);
  const [detectorCameraReady, setDetectorCameraReady] = useState(false);
  const [detectorCameraKey, setDetectorCameraKey] = useState(0);
  const previousDetectionRef = useRef<boolean | null>(null);
  const reportedFrameProcessorErrorRef = useRef(false);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);
    return () => subscription.remove();
  }, []);

  // Request camera permission while the viewer is active.
  useEffect(() => {
    if (isFocused && !hasPermission) {
      void requestPermission();
    }
    return () => {
      resetDetection();
    };
  }, [hasPermission, isFocused, requestPermission, resetDetection]);

  useEffect(() => {
    if (phoneDetectionModelError) {
      console.warn('[PhoneDetector] Failed to load detection model:', phoneDetectionModelError);
    }
  }, [phoneDetectionModelError]);

  const shouldPrepareDetectorCamera =
    isFocused &&
    appState === 'active' &&
    hasPermission &&
    Boolean(device);

  useEffect(() => {
    if (!shouldPrepareDetectorCamera) {
      setDetectorCameraReady(false);
      resetDetection();
      return;
    }

    setDetectorCameraReady(false);
    const timeout = setTimeout(() => {
      setDetectorCameraReady(true);
    }, DETECTOR_CAMERA_START_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [detectorCameraKey, resetDetection, shouldPrepareDetectorCamera]);

  const handleDetectorCameraError = (error: CameraRuntimeError) => {
    console.warn('[PhoneDetector] Viewer camera error:', error.code, error.message);
    resetDetection();
    setDetectorCameraKey((key) => key + 1);
  };

  const detectorCameraActive =
    shouldPrepareDetectorCamera &&
    detectorCameraReady;

  useEffect(() => {
    if (!user?.id || previousDetectionRef.current === isExternalDeviceDetected) return;

    const previousDetection = previousDetectionRef.current;
    previousDetectionRef.current = isExternalDeviceDetected;

    if (previousDetection === null) return;

    void logPhoneDetectionEvent({
      user_id: user.id,
      screen: 'viewer',
      event_type: isExternalDeviceDetected ? 'DETECTED' : 'CLEARED',
      confidence,
      device_info: { platform: Platform.OS },
    });
  }, [confidence, isExternalDeviceDetected, user?.id]);

  const onPhoneDetection = Worklets.createRunOnJS(updateDetectionState);
  const onFrameProcessorError = Worklets.createRunOnJS((message: string) => {
    if (reportedFrameProcessorErrorRef.current) return;
    reportedFrameProcessorErrorRef.current = true;
    console.warn('[PhoneDetector] Viewer frame processor failed:', message);
  });

  // Frame processor for phone detection.
  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';
      runAtTargetFps(PHONE_DETECTION_FPS, () => {
        'worklet';
        try {
          if (!boxedModel) {
            onPhoneDetection(emptyPhoneDetectionResult());
            return;
          }

          const model = boxedModel.unbox();
          const resized = resize(frame, {
            scale: {
              width: MODEL_INPUT_SIZE,
              height: MODEL_INPUT_SIZE,
            },
            pixelFormat: 'rgb',
            dataType: 'uint8',
          });
          const inputBuffer = resized.buffer.slice(
            resized.byteOffset,
            resized.byteOffset + resized.byteLength
          ) as ArrayBuffer;
          const outputs = model.runSync([inputBuffer]);
          onPhoneDetection(parsePhoneDetectionOutputs(outputs));
        } catch (error) {
          onFrameProcessorError(error == null ? 'Unknown error' : String(error));
          onPhoneDetection(emptyPhoneDetectionResult());
        }
      });
    },
    [boxedModel, onFrameProcessorError, onPhoneDetection, resize]
  );

  const handleDownload = async () => {
    if (!url) return;
    setIsDownloading(true);
    try {
      if (Platform.OS === 'web') {
        const filename = getFilenameFromUrl(url, `dibs_media_${Date.now()}`);
        await downloadUrlInBrowser(url, filename);
        await supabase.from('logs').insert({
          user_id: user?.id,
          name: user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User',
          details: `Downloaded media`,
          device: Platform.OS,
          status: 'verified',
          type: 'success',
        });
        return;
      }

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
      {/* Hidden camera for phone detection */}
      {detectorCameraActive && device && (
        <Camera
          key={`viewer-detector-${detectorCameraKey}`}
          ref={cameraRef}
          style={styles.detectorCamera}
          pointerEvents="none"
          device={device}
          isActive={detectorCameraActive}
          pixelFormat="yuv"
          enableBufferCompression={false}
          androidPreviewViewType="texture-view"
          onError={handleDetectorCameraError}
          frameProcessor={frameProcessor}
        />
      )}

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

      {/* Phone detection overlay */}
      {isExternalDeviceDetected && <PhoneDetectorOverlay />}
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
  detectorCamera: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 64,
    height: 64,
    opacity: 0.01,
  },
});
