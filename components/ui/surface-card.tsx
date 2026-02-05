import { StyleSheet, View, type ViewProps } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Props = ViewProps & {
  variant?: 'card' | 'glass';
};

export function SurfaceCard({ style, variant = 'card', ...props }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const isDark = scheme === 'dark';

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor:
            variant === 'glass'
              ? isDark
                ? 'rgba(12, 18, 32, 0.72)'
                : 'rgba(255, 255, 255, 0.9)'
              : theme.surface2,
          borderColor:
            variant === 'glass'
              ? isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(11, 27, 51, 0.06)'
              : theme.border,
          shadowOpacity: isDark ? 0.12 : 0.08,
        },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    shadowColor: '#000',
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
});
