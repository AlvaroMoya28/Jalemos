// Tab navigator layout — defines the four main bottom-tab screens of the app.
// Each tab uses HapticTab for tactile feedback on iOS and has a branded icon and label.

import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { HapticTab } from '@/components/haptic-tab';
import { Brand, Fonts, withElevation } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        animation: 'fade',
        // Active tab tint matches brand green; inactive uses medium grey
        tabBarActiveTintColor: Brand.colors.green.normal,
        tabBarInactiveTintColor: Brand.colors.black.b7,
        headerShown: false,
        // Custom pressable that fires haptic feedback on each tab press
        tabBarButton: HapticTab,
        sceneStyle: {
          backgroundColor: Brand.colors.black.b3,
        },
        tabBarStyle: {
          height: 74,
          paddingBottom: 10,
          paddingTop: 8,
          backgroundColor: Brand.colors.black.b2,
          borderTopColor: Brand.colors.green.light,
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
