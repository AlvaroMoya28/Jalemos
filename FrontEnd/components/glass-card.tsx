// Reusable glass-morphism card component.
// Simulates a frosted-glass effect using semi-transparent overlay layers scaled
// by the intensity prop — a pure React Native approximation (no BlurView) for
// performance. Automatically adapts its color layers to light or dark mode.

import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { Brand } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

type GlassCardProps = {
  children: ReactNode;
  /** Extra style overrides applied on top of the base card style. */
  style?: StyleProp<ViewStyle>;
  /** Controls how opaque the frosted layers are. Range 0–100; defaults to 36. */
  intensity?: number;
};

/**
 * Renders a frosted-glass card using two absolutely-positioned overlay layers
 * whose opacity is derived from the intensity prop. In dark mode the base
 * background and border shift to dark-teal values for a matching aesthetic.
 */
export default function GlassCard({ children, style, intensity = 36 }: GlassCardProps) {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.cardBase,
        {
          backgroundColor: colors.glassBg,
          borderColor: colors.glassBorder,
        },
        style,
      ]}
    >
      {/* Base frosted layer — opacity scales linearly with intensity */}
      <View
        style={[
          styles.surface,
          {
            backgroundColor: colors.glassSurface,
            opacity: Math.min(0.2 + intensity / 180, 0.55),
          },
        ]}
        pointerEvents="none"
      />
      {/* Top highlight layer — slightly lower opacity for a subtle sheen effect */}
      <View
        style={[
          styles.highlight,
          {
            backgroundColor: colors.glassHighlight,
            opacity: Math.min(0.14 + intensity / 320, 0.3),
          },
        ]}
        pointerEvents="none"
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  cardBase: {
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: Brand.radius[16],
  },
  surface: {
    ...StyleSheet.absoluteFillObject,
  },
  highlight: {
    ...StyleSheet.absoluteFillObject,
  },
});
