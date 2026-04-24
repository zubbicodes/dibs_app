import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useWatermark } from '@/hooks/use-watermark';
import { useDemoSession } from '@/hooks/demo-session';

interface WatermarkOverlayProps {
  size?: number;
}

export function WatermarkOverlay({ size = 120 }: WatermarkOverlayProps) {
  const { watermarkEnabled } = useWatermark();
  const { isVaultVerified } = useDemoSession();

  if (!watermarkEnabled || !isVaultVerified) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      <Image
        source={require('../assets/images/watermark.png')}
        style={[styles.watermark, { width: size, height: size }]}
        contentFit="contain"
        transition={200}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  watermark: {
    opacity: 0.7,
  },
});