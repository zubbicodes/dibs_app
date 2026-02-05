/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const primaryLight = '#0A2E65';
const accentLight = '#00C2D1';
const primaryDark = '#6AA8FF';
const accentDark = '#22C6D9';

export const Colors = {
  light: {
    text: '#0F1A2B',
    mutedText: '#5E6B82',
    background: '#F7F8FB',
    surface: '#F1F4F9',
    surface2: '#FFFFFF',
    border: '#E2E7F0',
    primary: primaryLight,
    accent: accentLight,
    success: '#27AE60',
    danger: '#EB5757',
    tint: accentLight,
    icon: '#64708A',
    tabIconDefault: '#7C889E',
    tabIconSelected: primaryLight,
  },
  dark: {
    text: '#EAF1FF',
    mutedText: '#9FB0CC',
    background: '#070A12',
    surface: '#0E1423',
    surface2: '#0A1020',
    border: '#1D2A44',
    primary: primaryDark,
    accent: accentDark,
    success: '#27AE60',
    danger: '#EB5757',
    tint: accentDark,
    icon: '#9FB0CC',
    tabIconDefault: '#9FB0CC',
    tabIconSelected: accentDark,
  },
};

export const FontFamilies = {
  regular: 'Poppins_400Regular',
  medium: 'Poppins_500Medium',
  semiBold: 'Poppins_600SemiBold',
  bold: 'Poppins_700Bold',
  extraBold: 'Poppins_800ExtraBold',
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
