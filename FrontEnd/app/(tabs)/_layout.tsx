import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { HapticTab } from '@/components/haptic-tab';
import { Brand, Fonts, withElevation } from '@/constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        animation: 'fade',
        tabBarActiveTintColor: Brand.colors.green.normal,
        tabBarInactiveTintColor: Brand.colors.black.b7,
        headerShown: false,
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
      <Tabs.Screen
        name="search"
        options={{
          title: 'Buscar',
          tabBarIcon: ({ color }) => <Ionicons size={22} name="map-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="offer"
        options={{
          title: 'Ofrecer',
          tabBarIcon: ({ color }) => <Ionicons size={22} name="car-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="my-rides"
        options={{
          title: 'Mis Viajes',
          tabBarIcon: ({ color }) => <Ionicons size={22} name="briefcase-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <Ionicons size={22} name="person-outline" color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
