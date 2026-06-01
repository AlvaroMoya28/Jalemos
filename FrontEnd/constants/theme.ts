// Central design-token file for the Jalemos brand.
// All colors, spacing, typography, radius, elevation, and component size constants live here.
// Import Brand, Colors, Fonts, or withElevation wherever styling is needed.

import { Platform } from 'react-native';

/** Master brand token object — single source of truth for all design decisions. */
export const Brand = {
  colors: {
    // Green palette — primary brand color family
    green: {
      light: '#bae2dd',
      lightHover: '#8dcfc7',
      lightActive: '#5fbbb1',
      normal: '#1a9e8f',
      normalHover: '#00e6b0',
      normalActive: '#00cc9d',
      dark: '#00bf93',
      darkHover: '#009976',
      darkActive: '#0d4f48',
      darker: '#0a3f39',
    },
    // Blue palette — used for upcoming/info states
    blue: {
      light: '#e6f9ff',
      lightHover: '#d9f5ff',
      lightActive: '#b0ebff',
      normal: '#00bfff',
      normalHover: '#00ace6',
      normalActive: '#0099cc',
      dark: '#008fbf',
      darkHover: '#007399',
      darkActive: '#005673',
      darker: '#004359',
    },
    // Yellow palette — used for ratings, warnings
    yellow: {
      light: '#f8e9bd',
      lightHover: '#f3da91',
      lightActive: '#ebc34e',
      normal: '#e6b422',
      normalHover: '#cfa21f',
      normalActive: '#b8901b',
      dark: '#8a6c14',
      darkHover: '#5c480e',
      darkActive: '#45360a',
      darker: '#171203',
    },
    // Greyscale palette — b1 is white, b13 is black; intermediate steps for text and surfaces
    black: {
      b1: '#ffffff',
      b2: '#fcfcfc',
      b3: '#f5f5f5',
      b4: '#f0f0f0',
      b5: '#d9d9d9',
      b6: '#bfbfbf',
      b7: '#8c8c8c',
      b8: '#595959',
      b9: '#454545',
      b10: '#262626',
      b11: '#1f1f1f',
      b12: '#141414',
      b13: '#000000',
    },
    // Semantic alert colors — used for status messages and badges
    alerts: {
      error: '#A6192A',
      warning: '#FFE711',
      success: '#3AE975',
      info: '#027CF7',
    },
    //shadow: '#18274B',
    shadow: 'rgba(0,0,0,0.0)',

  },
  grid: {
    margin: 24,
    gutter: 16,
  },
  spacing: {
    8: 8,
    12: 12,
    16: 16,
    24: 24,
    32: 32,
    48: 48,
    64: 64,
    80: 80,
    104: 104,
    128: 128,
    168: 168,
    192: 192,
  },
  radius: {
    4: 4,
    8: 8,
    12: 12,
    16: 16,
    24: 24,
    32: 32,
  },
  typography: {
    h1: { fontSize: 48, fontWeight: '900' as const },
    h2: { fontSize: 40, fontWeight: '700' as const },
    h3: { fontSize: 32, fontWeight: '600' as const },
    h4: { fontSize: 24, fontWeight: '500' as const },
  },
  logos: {
    sm: 24,
    md: 32,
    lg: 48,
    xl: 64,
    hero: 168,
  },
  toggle: {
    width: 64,
    height: 28,
    knobWidth: 39,
    knobHeight: 24,
    frameWidth: 1,
    frameHeight: 10,
    inset: 2,
  },
  buttonSizes: {
    small: { height: 28, paddingX: 16, fontSize: 12 },
    medium: { height: 36, paddingX: 20, fontSize: 13 },
    regular: { height: 44, paddingX: 24, fontSize: 14 },
    large: { height: 52, paddingX: 28, fontSize: 15 },
  },
} as const;

// Tint colors for light and dark mode (used by the React Navigation theme)
const tintColorLight = Brand.colors.green.normal;
const tintColorDark = Brand.colors.green.normal;

/** Light/dark semantic color map consumed by useThemeColor, useAppTheme, and the navigation theme. */
export const Colors = {
  light: {
    // React Navigation tokens
    text: Brand.colors.black.b10,
    background: Brand.colors.black.b3,
    tint: tintColorLight,
    icon: Brand.colors.black.b8,
    tabIconDefault: Brand.colors.black.b8,
    tabIconSelected: tintColorLight,
    // Screen & surface backgrounds
    screenBg: Brand.colors.black.b3,
    surface: Brand.colors.black.b1,
    surfaceAlt: Brand.colors.black.b2,
    bottomSurface: Brand.colors.black.b1,
    // Text
    textPrimary: Brand.colors.black.b10,
    textSecondary: Brand.colors.black.b8,
    textMuted: Brand.colors.black.b7,
    textPlaceholder: '#758783',
    // Borders
    border: Brand.colors.green.light,
    borderSubtle: 'rgba(186, 226, 221, 0.82)',
    // Inputs
    inputBg: Brand.colors.black.b1,
    inputText: Brand.colors.black.b10,
    // Tab bar
    tabBarBg: Brand.colors.black.b2,
    tabBarBorder: Brand.colors.green.light,
    // Header banner
    headerBg: Brand.colors.green.dark,
    // Calendar / modal cards
    calendarBg: 'rgba(245, 253, 250, 0.95)',
    calendarBorder: 'rgba(186, 226, 221, 0.95)',
    // GlassCard layers
    glassBg: 'rgba(255, 255, 255, 0.17)',
    glassBorder: 'rgba(186, 226, 221, 0.82)',
    glassSurface: 'rgba(255, 255, 255, 0.16)',
    glassHighlight: 'rgba(255, 255, 255, 0.24)',
    // Component-specific
    clearBtnBg: 'rgba(255, 255, 255, 0.82)',
    seatCompactBg: 'rgba(255, 255, 255, 0.68)',
    wheelBg: 'rgba(255, 255, 255, 0.9)',
    vehicleCardBg: 'rgba(255, 255, 255, 0.66)',
    vehicleCardActiveBg: 'rgba(255, 255, 255, 0.86)',
    walletCounterBg: 'rgba(255, 255, 255, 0.62)',
    logoutBg: '#fff0f1',
    segmentBg: Brand.colors.green.light,
    segmentActiveBg: Brand.colors.black.b1,
    radioOuterBg: Brand.colors.black.b1,
  },
  dark: {
    // React Navigation tokens
    text: Brand.colors.black.b2,
    background: '#060e0d',
    tint: tintColorDark,
    icon: Brand.colors.black.b6,
    tabIconDefault: Brand.colors.black.b6,
    tabIconSelected: tintColorDark,
    // Screen & surface backgrounds — deep dark teal, significantly darker than before
    screenBg: '#060e0d',
    surface: '#0a1916',
    surfaceAlt: '#081412',
    bottomSurface: '#0a1916',
    // Text
    textPrimary: Brand.colors.black.b2,
    textSecondary: Brand.colors.black.b5,
    textMuted: Brand.colors.black.b6,
    textPlaceholder: '#3d5c58',
    // Borders
    border: 'rgba(26, 158, 143, 0.4)',
    borderSubtle: 'rgba(26, 158, 143, 0.22)',
    // Inputs
    inputBg: '#091513',
    inputText: Brand.colors.black.b2,
    // Tab bar
    tabBarBg: '#091412',
    tabBarBorder: 'rgba(26, 158, 143, 0.28)',
    // Header banner
    headerBg: Brand.colors.green.darkActive,
    // Calendar / modal cards
    calendarBg: 'rgba(6, 16, 14, 0.98)',
    calendarBorder: 'rgba(26, 158, 143, 0.4)',
    // GlassCard layers
    glassBg: 'rgba(10, 38, 34, 0.32)',
    glassBorder: 'rgba(26, 158, 143, 0.3)',
    glassSurface: 'rgba(10, 38, 34, 0.2)',
    glassHighlight: 'rgba(255, 255, 255, 0.06)',
    // Component-specific
    clearBtnBg: 'rgba(8, 20, 18, 0.92)',
    seatCompactBg: 'rgba(8, 20, 18, 0.92)',
    wheelBg: 'rgba(7, 17, 15, 0.96)',
    vehicleCardBg: 'rgba(9, 25, 22, 0.88)',
    vehicleCardActiveBg: 'rgba(12, 34, 30, 0.95)',
    walletCounterBg: 'rgba(7, 17, 15, 0.9)',
    logoutBg: 'rgba(60, 15, 15, 0.6)',
    segmentBg: 'rgba(26, 158, 143, 0.18)',
    segmentActiveBg: '#0a1916',
    radioOuterBg: '#0a1916',
  },
};

/**
 * Platform-aware font family map.
 * iOS and Android load the Poppins font by name; web falls back to a system-ui stack.
 */
export const Fonts = Platform.select({
  ios: {
    sans: 'Poppins_400Regular',
    heading: 'Poppins_600SemiBold',
    headingBold: 'Poppins_700Bold',
    headingHeavy: 'Poppins_900Black',
    serif: 'ui-serif',
    rounded: 'Poppins_500Medium',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'Poppins_400Regular',
    heading: 'Poppins_600SemiBold',
    headingBold: 'Poppins_700Bold',
    headingHeavy: 'Poppins_900Black',
    serif: 'serif',
    rounded: 'Poppins_500Medium',
    mono: 'monospace',
  },
  web: {
    sans: "'Poppins', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    heading: "'Poppins', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    headingBold: "'Poppins', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    headingHeavy: "'Poppins', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'Poppins', 'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

/** Discrete elevation levels — higher numbers cast a more prominent shadow. */
type ElevationLevel = 100 | 200 | 400 | 600 | 800;

// Precomputed shadow values for each elevation level.
// elevation prop is used on Android; shadowOffset/shadowRadius/shadowOpacity on iOS.
const elevations: Record<
  ElevationLevel,
  {
    shadowOffset: { width: 0; height: number };
    shadowRadius: number;
    shadowOpacity: number;
    elevation: number;
  }
> = {
  100: { shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, shadowOpacity: 0.12, elevation: 1 },
  200: { shadowOffset: { width: 0, height: 4 }, shadowRadius: 13, shadowOpacity: 0.12, elevation: 3 },
  400: { shadowOffset: { width: 0, height: 6 }, shadowRadius: 12, shadowOpacity: 0.12, elevation: 5 },
  600: { shadowOffset: { width: 0, height: 8 }, shadowRadius: 18, shadowOpacity: 0.12, elevation: 7 },
  800: { shadowOffset: { width: 0, height: 8 }, shadowRadius: 28, shadowOpacity: 0.12, elevation: 9 },
};

/**
 * Returns a StyleSheet-compatible shadow object for the given elevation level.
 * Spread the result into a style object: `{ ...withElevation(200) }`.
 */
export function withElevation(level: ElevationLevel) {
  return {
    shadowColor: Brand.colors.shadow,
    ...elevations[level],
  };
}
