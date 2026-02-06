import { Image, ImageStyle, StyleProp } from 'react-native';

const DIBS_LOGO = require('../assets/dibs_logo.png');

type DibsLogoProps = {
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'center';
};

export function DibsLogo({
  width = 160,
  height = 60,
  style,
  resizeMode = 'contain',
}: DibsLogoProps) {
  return (
    <Image
      source={DIBS_LOGO}
      style={[{ width, height }, style]}
      resizeMode={resizeMode}
      accessibilityLabel="DIBS logo"
    />
  );
}
