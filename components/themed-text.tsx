import { StyleSheet, Text, type TextProps } from 'react-native';

import { FontFamilies } from '@/constants/theme';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const linkColor = useThemeColor({}, 'accent');

  return (
    <Text
      style={[
        { color, fontFamily: FontFamilies.regular },
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? [styles.link, { color: linkColor }] : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: FontFamilies.regular,
  },
  defaultSemiBold: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: FontFamilies.medium,
  },
  title: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: FontFamilies.semiBold,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 20,
    fontFamily: FontFamilies.semiBold,
  },
  link: {
    fontSize: 15,
    fontFamily: FontFamilies.semiBold,
  },
});
