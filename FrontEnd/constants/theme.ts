import { Platform } from 'react-native';

export const Brand = {
  colors: {
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
    alerts: {
      error: '#A6192A',
      warning: '#FFE711',
      success: '#3AE975',
      info: '#027CF7',
    },
    shadow: '#18274B',
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

const tintColorLight = Brand.colors.green.normal;
const tintColorDark = Brand.colors.black.b1;

export const Colors = {
  light: {
    text: Brand.colors.black.b10,
    background: Brand.colors.black.b3,
    tint: tintColorLight,
    icon: Brand.colors.black.b8,
    tabIconDefault: Brand.colors.black.b8,
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: Brand.colors.black.b2,
    background: Brand.colors.black.b12,
    tint: tintColorDark,
    icon: Brand.colors.black.b6,
    tabIconDefault: Brand.colors.black.b6,
    tabIconSelected: tintColorDark,
  },
};

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

type ElevationLevel = 100 | 200 | 400 | 600 | 800;

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

export function withElevation(level: ElevationLevel) {
  return {
    shadowColor: Brand.colors.shadow,
    ...elevations[level],
  };
}
