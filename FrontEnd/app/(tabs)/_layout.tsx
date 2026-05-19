import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Brand, Fonts, withElevation } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

export default function TabLayout() {
  const { colors } = useAppTheme();

  if (Platform.OS === 'ios') {
    return (
      <NativeTabs
        blurEffect="systemDefault"
        minimizeBehavior="automatic"
        iconColor={{ default: colors.textMuted, selected: Brand.colors.green.normal }}
        labelStyle={{
          default: { fontFamily: Fonts.heading, fontSize: 11, color: colors.textMuted },
          selected: { fontFamily: Fonts.heading, fontSize: 11, color: Brand.colors.green.normal },
        }}>
        <NativeTabs.Trigger name="search" />
        <NativeTabs.Trigger name="offer" />
        <NativeTabs.Trigger name="my-rides" />
        <NativeTabs.Trigger name="profile" />
      </NativeTabs>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Brand.colors.green.normal,
        tabBarInactiveTintColor: colors.textMuted,
        headerShown: false,
        tabBarButton: HapticTab,
        sceneStyle: { backgroundColor: colors.screenBg },
        tabBarStyle: {
          height: 74,
          paddingBottom: 10,
          paddingTop: 8,
          backgroundColor: colors.tabBarBg,
          borderTopColor: colors.tabBarBorder,
          ...withElevation(200),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: Fonts.heading,
        },
      }}>
      <Tabs.Screen
        name="search"
        options={{
          title: 'Buscar',
          tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="offer"
        options={{
          title: 'Ofrecer',
          tabBarIcon: ({ color, size }) => <Ionicons name="car-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="my-rides"
        options={{
          title: 'Mis Viajes',
          tabBarIcon: ({ color, size }) => <Ionicons name="briefcase-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="explore" options={{ href: null }} />
    </Tabs>
  );
}
