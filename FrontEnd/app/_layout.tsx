// Root layout for the Expo Router navigation tree.
// Loads Poppins fonts, prevents the splash screen from hiding until fonts are ready,
// and wraps the entire app in the React Navigation theme provider.

import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_900Black,
} from "@expo-google-fonts/poppins";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useAssets } from "expo-asset";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import { AdminUsersProvider } from "@/contexts/admin-users";
import { ApplicationsProvider } from "@/contexts/applications";
import { AuthProvider } from "@/contexts/auth";
import { LoadingProvider } from "@/contexts/loading";
import { ActiveTripProvider } from "@/contexts/active-trip";
import { UserModeProvider } from "@/contexts/user-mode";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { styles } from "../styles/app/_layout.styles";

// Tell Expo Router the default tab group so the navigator anchors there on launch
export const unstable_settings = {
  anchor: "(tabs)",
};

// Keep the splash screen visible until fonts are loaded to avoid a flash of unstyled text
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // Load all Poppins weight variants used throughout the app
  useAssets([
    require('../assets/images/hero-banner.jpg'),
    require('../assets/images/hero-banner-dark.jpg'),
    require('../assets/images/tropical-bg.jpg'),
    require('../assets/images/tropical-bg-dark.jpg'),
    require('../assets/images/jalemos-loader-car.png'),
    require('../assets/images/jalemos-logo2.png'),
  ]);

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
    <GestureHandlerRootView style={styles.root}>
      <AuthProvider>
        <ApplicationsProvider>
          <AdminUsersProvider>
            <UserModeProvider>
              <ThemeProvider
                value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
              >
                  <ActiveTripProvider>
                  <LoadingProvider>
                    <Stack
                      screenOptions={{
                        headerShown: false,
                        animation: "fade",
                        animationDuration: 220,
                        gestureEnabled: true,
                      }}
                    >
                      {/* Login / landing screen — no header needed */}
                      <Stack.Screen
                        name="index"
                        options={{ headerShown: false }}
                      />
                      {/* Tab navigator group — no header, tabs manage their own titles */}
                      <Stack.Screen
                        name="(tabs)"
                        options={{ headerShown: false }}
                      />
                      {/* Registration screen */}
                      <Stack.Screen
                        name="register"
                        options={{ headerShown: false }}
                      />
                      {/* Driver registration */}
                      <Stack.Screen
                        name="driver-registration"
                        options={{ headerShown: false }}
                      />
                      {/* Ride detail — drill-down from search results */}
                      <Stack.Screen
                        name="ride-detail"
                        options={{
                          headerShown: false,
                          animation: "slide_from_right",
                        }}
                      />
                      {/* Driver application status — shown after submitting driver registration */}
                      <Stack.Screen
                        name="driver-status"
                        options={{
                          headerShown: false,
                          animation: "slide_from_right",
                        }}
                      />
                      {/* Admin: full application review */}
                      <Stack.Screen
                        name="application-detail"
                        options={{
                          headerShown: false,
                          animation: "slide_from_right",
                        }}
                      />
                      {/* Políticas de uso */}
                      <Stack.Screen
                        name="policies"
                        options={{
                          headerShown: false,
                          animation: "slide_from_right",
                        }}
                      />
                      {/* Transparent modal overlay that slides up from the bottom */}
                      <Stack.Screen
                        name="modal"
                        options={{
                          presentation: "transparentModal",
                          title: "Modal",
                          animation: "fade_from_bottom",
                        }}
                      />
                    </Stack>
                    <StatusBar style="auto" />
                  </LoadingProvider>
                  </ActiveTripProvider>
              </ThemeProvider>
            </UserModeProvider>
          </AdminUsersProvider>
        </ApplicationsProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
