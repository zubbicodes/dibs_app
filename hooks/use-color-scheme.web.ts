import { useEffect, useState } from 'react';

import { ThemeModeProvider, useColorScheme as useAppColorScheme, useSetColorScheme } from './theme-provider';

export { ThemeModeProvider, useSetColorScheme };

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  const colorScheme = useAppColorScheme();

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
