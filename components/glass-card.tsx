import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { Brand } from '@/constants/theme';

type GlassCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
};

export default function GlassCard({ children, style, intensity = 36 }: GlassCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={[styles.surface, { opacity: Math.min(0.2 + intensity / 180, 0.55) }]} pointerEvents="none" />
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
  surface: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  highlight: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
  },
});
