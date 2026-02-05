import { StyleSheet, View, type ViewProps } from 'react-native';

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

type Props = ViewProps & {
  tone?: 'neutral' | 'accent' | 'danger' | 'success';
};

export function Pill({ style, tone = 'neutral', ...props }: Props) {
  const scheme = useColorScheme() ?? 'light';
  const theme = Colors[scheme];
  const isDark = scheme === 'dark';

  const toneColor =
    tone === 'accent' ? theme.accent : tone === 'danger' ? theme.danger : tone === 'success' ? theme.success : theme.border;

  const bg =
    tone === 'neutral'
      ? isDark
        ? 'rgba(255, 255, 255, 0.06)'
        : 'rgba(11, 27, 51, 0.05)'
      : isDark
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(255, 255, 255, 0.78)';

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: bg,
          borderColor: toneColor,
        },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
