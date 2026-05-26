// Tab navigator layout — renders different tab bars depending on user role and mode.
// Admin role:     Applications, Reports, Profile.
// Passenger mode: Search, My Rides, Profile.
// Driver mode:    Offer,  My Rides, Profile.
// On iOS uses NativeTabs (expo-router/unstable-native-tabs) for the liquid-glass pill effect
// introduced in iOS 26. On Android / web falls back to the standard Tabs navigator with a
// solid tab bar. Tab icons are configured per-screen via navigation.setOptions so they bypass
// the EXPO_OS platform guard in the NativeTabs icon pipeline.

import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/auth';
import { useLoading } from '@/contexts/loading';
import { useUserMode } from '@/contexts/user-mode';
import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Brand, Fonts, withElevation } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

export default function TabLayout() {
  const { colors } = useAppTheme();
  const { user } = useAuth();
  const { mode } = useUserMode();
  const { showLoader, hideLoader } = useLoading();

  const isAdmin = user?.role === 'admin';
  const isDriver = mode === 'driver';

  const tabBarStyle = {
    height: 74,
    paddingBottom: 10,
    paddingTop: 8,
    backgroundColor: colors.tabBarBg,
    borderTopColor: colors.tabBarBorder,
    ...withElevation(200),
  };

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
        {/* Admin triggers */}
        <NativeTabs.Trigger name="admin-applications" hidden={!isAdmin} />
        <NativeTabs.Trigger name="admin-reports" hidden={!isAdmin} />
        <NativeTabs.Trigger name="admin-users" hidden={!isAdmin} />
        {/* Regular user triggers */}
        <NativeTabs.Trigger name="search" hidden={isAdmin || isDriver} />
        <NativeTabs.Trigger name="offer" hidden={isAdmin || !isDriver} />
        <NativeTabs.Trigger name="my-rides" hidden={isAdmin} />
        <NativeTabs.Trigger name="profile" />
      </NativeTabs>
    );
  }

  return (
    <Tabs
      screenListeners={{
        tabPress: () => {
          showLoader('Cargando...');
          setTimeout(hideLoader, 320);
        },
      }}
      screenOptions={{
        tabBarActiveTintColor: Brand.colors.green.normal,
        tabBarInactiveTintColor: colors.textMuted,
        headerShown: false,
        tabBarButton: HapticTab,
        sceneStyle: { backgroundColor: colors.screenBg },
        tabBarStyle,
        tabBarLabelStyle: { fontSize: 11, fontFamily: Fonts.heading },
        animation: 'shift',
      }}>
      {/* Admin tabs */}
      <Tabs.Screen
        name="admin-applications"
        options={{
          title: 'Solicitudes',
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, size }) => <Ionicons name="document-text-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="admin-reports"
        options={{
          title: 'Reportes',
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, size }) => <Ionicons name="flag-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="admin-users"
        options={{
          title: 'Usuarios',
          href: isAdmin ? undefined : null,
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
        }}
      />
      {/* Passenger / driver tabs */}
      <Tabs.Screen
        name="search"
        options={{
          title: 'Buscar',
          href: isAdmin || isDriver ? null : undefined,
          tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="offer"
        options={{
          title: 'Ofrecer',
          href: isAdmin || !isDriver ? null : undefined,
          tabBarIcon: ({ color, size }) => <Ionicons name="car-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="my-rides"
        options={{
          title: 'Mis Viajes',
          href: isAdmin ? null : undefined,
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
