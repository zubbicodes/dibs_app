import { Platform } from 'react-native';

let nitro: any;

if (Platform.OS !== 'web') {
  try { nitro = require('react-native-nitro-modules'); } catch {}
}

export const NitroModules = nitro?.NitroModules ?? { box: <T>(value: T): T => value };
