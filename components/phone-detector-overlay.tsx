/**
 * Full-screen blocker shown when another camera/phone is detected near the vault.
 */
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { UNBLOCK_DELAY_MS } from '@/constants/detection';

export function PhoneDetectorOverlay() {
  const [timeRemaining, setTimeRemaining] = useState(UNBLOCK_DELAY_MS / 1000);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => (prev <= 0.1 ? 0 : prev - 0.1));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <Pressable
      style={styles.overlay}
      disabled
      onPress={(event) => event.preventDefault()}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="no-photography" size={64} color="#FF6B6B" />
        </View>

        <ThemedText style={styles.title}>Camera Detected</ThemedText>

        <ThemedText style={styles.message}>
          Move the external device away from the screen to continue
        </ThemedText>

        <View style={styles.timerContainer}>
          <View style={styles.timerRing}>
            <ThemedText style={styles.timerText}>{Math.ceil(timeRemaining)}s</ThemedText>
          </View>
          <ThemedText style={styles.timerLabel}>Auto-unblocking in...</ThemedText>
        </View>

        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${(timeRemaining / (UNBLOCK_DELAY_MS / 1000)) * 100}%`,
              },
            ]}
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 24,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 36,
    lineHeight: 24,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  timerRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  timerText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  timerLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    letterSpacing: 0.5,
  },
  progressBarContainer: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FF6B6B',
    borderRadius: 2,
  },
});
