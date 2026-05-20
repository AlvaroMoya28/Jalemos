// Root layout for the Expo Router navigation tree.
// Loads Poppins fonts, prevents the splash screen from hiding until fonts are ready,
// and wraps the entire app in the React Navigation theme provider.

import {
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_900Black,
} from '@expo-google-fonts/poppins';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { UserModeProvider } from '@/contexts/user-mode';

// Tell Expo Router the default tab group so the navigator anchors there on launch
export const unstable_settings = {
  anchor: '(tabs)',
};

// Keep the splash screen visible until fonts are loaded to avoid a flash of unstyled text
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Load all Poppins weight variants used throughout the app
  const [loaded, error] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_900Black,
  });

  // Hide splash screen once fonts finish loading (or if they fail to load)
  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // Render nothing while fonts are still loading so no layout shift occurs
  if (!loaded && !error) {
    return null;
  }

  return (
    // Apply light or dark navigation theme based on the device setting
    <UserModeProvider>
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          animationDuration: 220,
          gestureEnabled: true,
        }}
      >
        {/* Login / landing screen — no header needed */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        {/* Tab navigator group — no header, tabs manage their own titles */}
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        {/* Registration screen */}
        <Stack.Screen name="register" options={{ headerShown: false }} />
        {/* Driver registration */}
        <Stack.Screen name="driver-registration" options={{ headerShown: false }} />
        {/* Transparent modal overlay that slides up from the bottom */}
        <Stack.Screen
          name="modal"
          options={{ presentation: 'transparentModal', title: 'Modal', animation: 'fade_from_bottom' }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
    </UserModeProvider>
  );
}
