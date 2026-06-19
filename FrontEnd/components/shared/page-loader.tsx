// Full-screen glassmorphism loading overlay.
// The car image bobs gently while leaves drift backward from its rear.
// Control visibility via LoadingContext (contexts/loading.tsx).

import { Brand, Fonts } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { BlurView } from 'expo-blur';
import React, { useEffect } from 'react';
import { Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
    cancelAnimation,
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const CAR_W = 120;
const CAR_H = 80;

const LEAF_DUR   = 1600;
const LEAF_DRIFT = 150;
const LEAF_COUNT = 6;
const LEAF_PHASE = LEAF_DUR / LEAF_COUNT;

const CAR_TOP    = SCREEN_H * 0.44 - CAR_H;
const GROUND_TOP = SCREEN_H * 0.44;
const CAR_LEFT   = (SCREEN_W - CAR_W) / 2;

// Leaves spawn just behind the rear wheel of the car
const LEAF_SPAWN_X = CAR_LEFT + 14;
const LEAF_Y       = CAR_TOP + CAR_H * 0.74;

const LEAVES = [
  { yOff: -12, delay: LEAF_PHASE * 0, emoji: '🍃', swayAmp:  6, swayDur: 380 },
  { yOff:   4, delay: LEAF_PHASE * 1, emoji: '🍂', swayAmp:  9, swayDur: 310 },
  { yOff:  -6, delay: LEAF_PHASE * 2, emoji: '🍃', swayAmp:  5, swayDur: 420 },
  { yOff:   8, delay: LEAF_PHASE * 3, emoji: '🌿', swayAmp:  8, swayDur: 350 },
  { yOff:  -2, delay: LEAF_PHASE * 4, emoji: '🍃', swayAmp:  7, swayDur: 400 },
  { yOff:  -9, delay: LEAF_PHASE * 5, emoji: '🍂', swayAmp:  5, swayDur: 440 },
] as const;

function LeafParticle({
  yOff, delay, emoji, swayAmp, swayDur,
}: {
  yOff: number; delay: number; emoji: string; swayAmp: number; swayDur: number;
}) {
  const p    = useSharedValue(0);
  const sway = useSharedValue(0);

  useEffect(() => {
    // Linear drift → leaves stay evenly spaced along the trail at all times
    p.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: LEAF_DUR, easing: Easing.linear }),
        -1, false
      )
    );
    // Independent vertical sway per leaf — starts immediately, unrelated to drift
    sway.value = withRepeat(
      withSequence(
        withTiming( 1, { duration: swayDur, easing: Easing.inOut(Easing.sin) }),
        withTiming(-1, { duration: swayDur, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, true
    );
    return () => { cancelAnimation(p); cancelAnimation(sway); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const style = useAnimatedStyle(() => {
    const t = p.value;
    // Fade in quickly at spawn, fade out in the last 25% of travel
    const opacity = t < 0.08
      ? t / 0.08
      : t > 0.75
        ? Math.max(0, 1 - (t - 0.75) / 0.25)
        : 1;
    return {
      position: 'absolute',
      left: LEAF_SPAWN_X - t * LEAF_DRIFT,
      top:  LEAF_Y + yOff + t * 18 + sway.value * swayAmp,
      transform: [{ rotate: `${t * 90 - 15 + sway.value * 18}deg` }],
      opacity,
    };
  });

  return <Animated.Text style={[{ fontSize: 14 }, style]}>{emoji}</Animated.Text>;
}

export interface PageLoaderProps {
  visible?: boolean;
  label?: string;
}

export default function PageLoader({ visible = true, label = 'Cargando...' }: PageLoaderProps) {
  const { isDark } = useAppTheme();
  const bobY = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    bobY.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 420, easing: Easing.inOut(Easing.sin) }),
        withTiming( 0, { duration: 420, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, false
    );
    return () => cancelAnimation(bobY);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const carStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bobY.value }],
  }));

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

      <Animated.View style={[styles.car, carStyle]}>
        <Image
          source={require('../../assets/images/jalemos-loader-car.png')}
          style={styles.carImage}
          resizeMode="contain"
        />
      </Animated.View>

      {LEAVES.map((l, i) => (
        <LeafParticle key={i} yOff={l.yOff} delay={l.delay} emoji={l.emoji} swayAmp={l.swayAmp} swayDur={l.swayDur} />
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

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 9999 },
  sheen:   { position: 'absolute', top: 0, left: 0, right: 0, height: 2 },
  ground:  { position: 'absolute', top: GROUND_TOP, left: 0, right: 0, height: 1 },
  car: {
    position: 'absolute',
    top:  CAR_TOP,
    left: CAR_LEFT,
  },
  carImage: {
    width:  CAR_W,
    height: CAR_H,
  },
  labelWrap: {
    position: 'absolute',
    top: GROUND_TOP + 24,
    left: 0, right: 0,
    alignItems: 'center',
  },
  labelText: { fontSize: 15, letterSpacing: 0.5 },
});
