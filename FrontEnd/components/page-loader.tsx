// Full-screen glassmorphism loading overlay.
// The car sits centred on screen with spinning wheels (simulating movement).
// Leaves drift backward from the rear to reinforce the "driving" feel.
// Control visibility via LoadingContext (contexts/loading.tsx).

import React, { useEffect } from 'react';
import { Dimensions, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Brand, Fonts } from '@/constants/theme';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const CAR_W        = 96;
const CAR_H        = 68;
const WHEEL_RPM_MS = 340;
// Each leaf takes LEAF_DUR ms to travel LEAF_DRIFT px to the left.
// With 5 leaves spaced LEAF_DUR/5 ms apart they are always evenly spread
// along the whole trail — no bunching.
const LEAF_DUR   = 1200;
const LEAF_DRIFT = 110; // total horizontal travel (px)
const LEAF_PHASE = LEAF_DUR / 5; // 240 ms between each leaf

const CAR_TOP      = SCREEN_H * 0.44 - CAR_H;
const GROUND_TOP   = SCREEN_H * 0.44;
const CAR_LEFT     = (SCREEN_W - CAR_W) / 2;
// X where leaves spawn — just left of the car's rear edge
const LEAF_SPAWN_X = CAR_LEFT + 10;
const LEAF_Y       = CAR_TOP + CAR_H * 0.40;

// Only yOff varies so leaves are vertically staggered; horizontal spread
// comes entirely from the evenly-phased delays.
const LEAVES = [
  { yOff: -14, delay: LEAF_PHASE * 0, emoji: '🍃' },
  { yOff:  -4, delay: LEAF_PHASE * 1, emoji: '🍃' },
  { yOff: -10, delay: LEAF_PHASE * 2, emoji: '🌿' },
  { yOff:   2, delay: LEAF_PHASE * 3, emoji: '🍃' },
  { yOff:  -7, delay: LEAF_PHASE * 4, emoji: '🍂' },
] as const;

// ─── Wheel ────────────────────────────────────────────────────────────────────

const WHEEL = 28;

function Wheel({
  pos,
  carColor,
  hubColor,
  rotation,
}: {
  pos: ViewStyle;
  carColor: string;
  hubColor: string;
  rotation: SharedValue<number>;
}) {
  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View style={[styles.wheelOuter, { backgroundColor: carColor }, pos]}>
      <View style={[styles.wheelRing, { borderColor: hubColor }]} />
      <Animated.View style={[styles.hub, { backgroundColor: hubColor }, spinStyle]}>
        <View style={[styles.spoke,  { backgroundColor: carColor }]} />
        <View style={[styles.spokeV, { backgroundColor: carColor }]} />
      </Animated.View>
    </View>
  );
}

// ─── Compact chibi car (faces right) ─────────────────────────────────────────

function SideCar({
  carColor,
  glassColor,
  hubColor,
  rotation,
}: {
  carColor: string;
  glassColor: string;
  hubColor: string;
  rotation: SharedValue<number>;
}) {
  return (
    <View style={styles.carBody}>
      <Text style={styles.plant}>🌿</Text>

      <View style={[styles.cabin, { backgroundColor: carColor }]}>
        <View style={[styles.winRear,  { backgroundColor: glassColor }]} />
        <View style={[styles.bPillar,  { backgroundColor: carColor }]} />
        <View style={[styles.winFront, { backgroundColor: glassColor }]} />
      </View>

      <View style={[styles.chassis,   { backgroundColor: carColor }]} />
      <View style={[styles.rearBump,  { backgroundColor: carColor }]} />
      <View style={[styles.frontNose, { backgroundColor: carColor }]} />
      <View style={[styles.handle,    { backgroundColor: glassColor }]} />

      <Wheel pos={styles.rearWheelPos}  carColor={carColor} hubColor={hubColor} rotation={rotation} />
      <Wheel pos={styles.frontWheelPos} carColor={carColor} hubColor={hubColor} rotation={rotation} />
    </View>
  );
}

// ─── Fixed-position car wrapper ───────────────────────────────────────────────

function CarIcon({
  wheelRotation,
  isDark,
}: {
  wheelRotation: SharedValue<number>;
  isDark: boolean;
}) {
  const carColor   = isDark ? Brand.colors.green.normalHover : Brand.colors.green.normal;
  const glassColor = isDark ? 'rgba(6,30,28,0.55)'          : 'rgba(255,255,255,0.38)';
  const hubColor   = isDark ? Brand.colors.green.darker     : Brand.colors.black.b1;

  return (
    <View style={styles.car}>
      <SideCar carColor={carColor} glassColor={glassColor} hubColor={hubColor} rotation={wheelRotation} />
    </View>
  );
}

// ─── Leaf drifting backward from rear ────────────────────────────────────────

function LeafParticle({
  yOff, delay, emoji,
}: {
  yOff: number;
  delay: number;
  emoji: string;
}) {
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: LEAF_DUR, easing: Easing.out(Easing.quad) }),
        -1, false
      )
    );
    return () => cancelAnimation(p);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // All leaves travel the same LEAF_DRIFT distance — evenly spaced delays
  // ensure they are always distributed uniformly along the trail.
  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: LEAF_SPAWN_X - p.value * LEAF_DRIFT,
    top:  LEAF_Y + yOff + p.value * 24,
    transform: [{ rotate: `${p.value * 65 - 10}deg` }],
    opacity: Math.max(0, 1 - p.value * 1.05),
  }));

  return <Animated.Text style={[{ fontSize: 15 }, style]}>{emoji}</Animated.Text>;
}

// ─── Main component ───────────────────────────────────────────────────────────

export interface PageLoaderProps {
  visible?: boolean;
  label?: string;
}

export default function PageLoader({ visible = true, label = 'Cargando...' }: PageLoaderProps) {
  const { isDark }    = useAppTheme();
  const wheelRotation = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    wheelRotation.value = withRepeat(
      withTiming(360, { duration: WHEEL_RPM_MS, easing: Easing.linear }),
      -1, false
    );
    return () => cancelAnimation(wheelRotation);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <BlurView intensity={isDark ? 70 : 60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <View
        style={[StyleSheet.absoluteFill, {
          backgroundColor: isDark ? 'rgba(6,14,13,0.52)' : 'rgba(236,252,246,0.42)',
        }]}
        pointerEvents="none"
      />
      <View
        style={[styles.sheen, {
          backgroundColor: isDark ? 'rgba(26,158,143,0.2)' : 'rgba(255,255,255,0.55)',
        }]}
        pointerEvents="none"
      />
      <View
        style={[styles.ground, {
          backgroundColor: isDark ? 'rgba(26,158,143,0.3)' : 'rgba(26,158,143,0.22)',
        }]}
        pointerEvents="none"
      />

      <CarIcon wheelRotation={wheelRotation} isDark={isDark} />

      {LEAVES.map((l, i) => (
        <LeafParticle key={i} yOff={l.yOff} delay={l.delay} emoji={l.emoji} />
      ))}

      {label ? (
        <View style={styles.labelWrap} pointerEvents="none">
          <Text style={[styles.labelText, {
            color: isDark ? Brand.colors.green.light : Brand.colors.green.darkActive,
            fontFamily: Fonts.heading,
          }]}>
            {label}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 9999 },
  sheen:   { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  ground:  { position: 'absolute', top: GROUND_TOP, left: 0, right: 0, height: 1 },

  // Car sits centred, no translateX needed
  car: {
    position: 'absolute',
    top: CAR_TOP,
    left: CAR_LEFT,
  },

  carBody: { width: CAR_W, height: CAR_H },

  plant: {
    position: 'absolute',
    top: -8, left: 18,
    fontSize: 18,
    transform: [{ rotate: '-10deg' }],
  },

  cabin: {
    position: 'absolute',
    left: 6, right: 6, top: 4, height: 42,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 20,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    overflow: 'hidden',
  },
  winRear: {
    position: 'absolute',
    left: 5, top: 7, width: 28, bottom: 2,
    borderTopLeftRadius: 22, borderTopRightRadius: 4,
    borderBottomLeftRadius: 2, borderBottomRightRadius: 2,
  },
  bPillar: { position: 'absolute', left: 35, top: 0, bottom: 0, width: 5 },
  winFront: {
    position: 'absolute',
    left: 42, right: 4, top: 7, bottom: 2,
    borderTopRightRadius: 14, borderTopLeftRadius: 3,
    borderBottomLeftRadius: 2, borderBottomRightRadius: 2,
  },

  chassis: {
    position: 'absolute',
    left: 4, right: 4, top: 40, height: 22,
    borderRadius: 6,
    borderTopLeftRadius: 2, borderTopRightRadius: 2,
    borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
  },
  rearBump: {
    position: 'absolute',
    left: 0, top: 42, width: 8, height: 16,
    borderTopLeftRadius: 4, borderBottomLeftRadius: 10,
    borderTopRightRadius: 2, borderBottomRightRadius: 2,
  },
  frontNose: {
    position: 'absolute',
    right: 0, top: 42, width: 8, height: 16,
    borderTopRightRadius: 6, borderBottomRightRadius: 10,
    borderTopLeftRadius: 2, borderBottomLeftRadius: 2,
  },
  handle: {
    position: 'absolute',
    left: 58, top: 49, width: 10, height: 3,
    borderRadius: 2, opacity: 0.65,
  },

  rearWheelPos:  { position: 'absolute', bottom: 0, left:  8 },
  frontWheelPos: { position: 'absolute', bottom: 0, right: 8 },

  wheelOuter: {
    width: WHEEL, height: WHEEL,
    borderRadius: WHEEL / 2,
    alignItems: 'center', justifyContent: 'center',
  },
  wheelRing: {
    position: 'absolute',
    width: WHEEL - 7, height: WHEEL - 7,
    borderRadius: (WHEEL - 7) / 2,
    borderWidth: 1.5,
  },
  hub:    { width: 12, height: 12, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  spoke:  { position: 'absolute', width: 10, height: 2, borderRadius: 1 },
  spokeV: { position: 'absolute', width: 2, height: 10, borderRadius: 1 },

  labelWrap: {
    position: 'absolute',
    top: GROUND_TOP + 24,
    left: 0, right: 0,
    alignItems: 'center',
  },
  labelText: { fontSize: 15, letterSpacing: 0.5 },
});
