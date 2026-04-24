import { NativeModules, Platform } from 'react-native';

interface ScreenProtectionInterface {
  enableScreenProtection: () => void;
  disableScreenProtection: () => void;
}

const { DibsScreenProtection } = NativeModules;

export const enableScreenProtection = (): void => {
  if (DibsScreenProtection?.enableScreenProtection) {
    DibsScreenProtection.enableScreenProtection();
  }
};

export const disableScreenProtection = (): void => {
  if (DibsScreenProtection?.disableScreenProtection) {
    DibsScreenProtection.disableScreenProtection();
  }
};

export const setSecureFlag = (enabled: boolean): void => {
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    if (enabled) {
      enableScreenProtection();
    } else {
      disableScreenProtection();
    }
  }
};