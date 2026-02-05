import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export function HapticTab(props: BottomTabBarButtonProps) {
  const { children, onPressIn, onPressOut, ...rest } = props;
  const isPressed = useSharedValue(false);
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isPressed.value ? 0.82 : 1, { duration: 110 }),
      transform: [{ scale: withTiming(isPressed.value ? 0.96 : 1, { duration: 110 }) }],
    };
  });

  return (
    <PlatformPressable
      {...rest}
      onPressIn={(ev) => {
        isPressed.value = true;
        if (process.env.EXPO_OS === 'ios') {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPressIn?.(ev);
      }}
      onPressOut={(ev) => {
        isPressed.value = false;
        onPressOut?.(ev);
      }}>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </PlatformPressable>
  );
}
