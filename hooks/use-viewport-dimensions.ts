import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

export const TABLET_BREAKPOINT = 768;
export const DESKTOP_BREAKPOINT = 1024;

export interface ViewportDimensions {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export function useViewportDimensions(): ViewportDimensions {
  const window = useWindowDimensions();
  
  const dims = useMemo(() => {
    return window;
  }, [window]);

  return {
    ...dims,
    isMobile: dims.width < TABLET_BREAKPOINT,
    isTablet: dims.width >= TABLET_BREAKPOINT && dims.width < DESKTOP_BREAKPOINT,
    isDesktop: dims.width >= DESKTOP_BREAKPOINT,
  };
}
