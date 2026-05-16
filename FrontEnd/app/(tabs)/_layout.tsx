// Tab navigator layout — defines the four main bottom-tab screens of the app.
// Each tab uses HapticTab for tactile feedback on iOS and has a branded icon and label.
// Tab bar colors adapt automatically to the device light/dark mode setting.

import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { HapticTab } from '@/components/haptic-tab';
import { Brand, Fonts, withElevation } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

export default function TabLayout() {
  const { colors } = useAppTheme();

  return (
    <Tabs
      screenOptions={{
        animation: 'fade',
        // Active tab tint matches brand green; inactive uses muted grey
        tabBarActiveTintColor: Brand.colors.green.normal,
        tabBarInactiveTintColor: colors.textMuted,
        headerShown: false,
        tabBarButton: HapticTab,
        sceneStyle: {
          backgroundColor: colors.screenBg,
        },
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
      {/* Search tab — main entry point for finding available rides */}
      <Tabs.Screen
        name="search"
        options={{
          title: 'Buscar',
          tabBarIcon: ({ color }) => <Ionicons size={22} name="map-outline" color={color} />,
        }}
      />
      {/* Offer tab — lets drivers publish new trips */}
      <Tabs.Screen
        name="offer"
        options={{
          title: 'Ofrecer',
          tabBarIcon: ({ color }) => <Ionicons size={22} name="car-outline" color={color} />,
        }}
      />
      {/* My Rides tab — shows the user's trip history as passenger and driver */}
      <Tabs.Screen
        name="my-rides"
        options={{
          title: 'Mis Viajes',
          tabBarIcon: ({ color }) => <Ionicons size={22} name="briefcase-outline" color={color} />,
        }}
      />
      {/* Profile tab — account settings, vehicles, payment methods */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <Ionicons size={22} name="person-outline" color={color} />,
        }}
      />
      {/* Explore screen is hidden from the tab bar (href: null) — kept for internal routing */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
