// Reusable glass-morphism card component.
// Simulates a frosted-glass effect using semi-transparent white layers scaled by the
// intensity prop — a pure React Native approximation (no BlurView) for performance.

import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { Brand } from '@/constants/theme';

type GlassCardProps = {
  children: ReactNode;
  /** Extra style overrides applied on top of the base card style. */
  style?: StyleProp<ViewStyle>;
  /** Controls how opaque the frosted layers are. Range 0–100; defaults to 36. */
  intensity?: number;
};

/**
 * Renders a frosted-glass card using two absolutely-positioned white overlays
 * whose opacity is derived from the intensity prop.
 * Wrap any content with this component to apply the glass effect.
 */
export default function GlassCard({ children, style, intensity = 36 }: GlassCardProps) {
  return (
    <View style={[styles.card, style]}>
      {/* Base frosted layer — opacity scales linearly with intensity */}
      <View style={[styles.surface, { opacity: Math.min(0.2 + intensity / 180, 0.55) }]} pointerEvents="none" />
      {/* Top highlight layer — slightly lower opacity for a subtle sheen effect */}
      <View style={[styles.highlight, { opacity: Math.min(0.14 + intensity / 320, 0.3) }]} pointerEvents="none" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(186, 226, 221, 0.82)',
    backgroundColor: 'rgba(255, 255, 255, 0.17)',
    borderRadius: Brand.radius[16],
  },
  // Full-card white wash — gives the frosted base
  surface: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  // Lighter layer on top to simulate a specular highlight
  highlight: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
  },
});
