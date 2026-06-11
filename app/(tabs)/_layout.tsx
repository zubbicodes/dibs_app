import { Tabs } from 'expo-router';
import React, { useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { FloatingTabBar } from '@/components/floating-tab-bar';
import { WebSidebarNav } from '@/components/web-sidebar-nav';
import { OverlayPortalContext } from '@/hooks/overlay-portal-context';
import { useViewportDimensions } from '@/hooks/use-viewport-dimensions';

export default function TabLayout() {
  const overlayHostRef = useRef<View | null>(null);
  const { isDesktop } = useViewportDimensions();
  const useDesktopWebShell = Platform.OS === 'web' && isDesktop;

  return (
    <OverlayPortalContext.Provider value={Platform.OS === 'web' ? overlayHostRef : null}>
      <View style={[styles.container, useDesktopWebShell ? styles.desktopContainer : null]}>
        {useDesktopWebShell ? <WebSidebarNav /> : null}
        <Tabs
          screenOptions={{
            headerShown: false,
          }}
          tabBar={(props) => (useDesktopWebShell ? null : <FloatingTabBar {...props} />)}
        />
        {Platform.OS === 'web' ? (
          <View
            ref={overlayHostRef}
            style={styles.portalHost}
            pointerEvents="box-none"
            collapsable={false}
          />
        ) : null}
      </View>
    </OverlayPortalContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative' as const,
  },
  desktopContainer: {
    flexDirection: 'row',
    minHeight: '100vh' as unknown as number,
  },
  portalHost: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    elevation: 9999,
    pointerEvents: 'box-none' as const,
  },
});
