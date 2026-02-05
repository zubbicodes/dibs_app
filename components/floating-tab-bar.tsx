import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export function FloatingTabBar({ state, descriptors, navigation }: any) {
  const colorScheme = useColorScheme() ?? 'light';
  const theme = Colors[colorScheme];

  const tabs = [
    { name: 'Home', icon: 'home' as const },
    { name: 'Vault', icon: 'lock' as const },
    { name: 'Logs', icon: 'list' as const },
    { name: 'Settings', icon: 'settings' as const },
  ];

  return (
    <View style={styles.wrapper}>
      <View style={[styles.tabBar, { backgroundColor: theme.surface2, borderColor: theme.border }]}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={index}
              onPress={onPress}
              style={styles.tabButton}
            >
              <MaterialIcons
                name={tabs[index].icon}
                size={22}
                color={isFocused ? theme.primary : theme.icon}
              />
              {isFocused && <View style={[styles.activeDot, { backgroundColor: theme.primary }]} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    width: '90%',
    height: 65,
    borderRadius: 35,
    justifyContent: 'space-around',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 10,
    marginTop: 4,
  },
});
