// Pressable wrapper that applies a smooth scale animation on press.
// Uses Reanimated shared values so the animation runs on the UI thread,
// avoiding JS thread jank during rapid taps.

import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

type AnimatedPressableProps = PressableProps & {
  style?: StyleProp<ViewStyle>;
  /** Scale factor when pressed — values close to 1 (e.g. 0.985) give a subtle effect. */
  pressedScale?: number;
};

// Wrap the built-in Pressable so Reanimated can animate its transform
const ReanimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Drop-in replacement for Pressable that shrinks slightly on press and
 * springs back on release. Forwards all standard PressableProps.
 */
export default function AnimatedPressable({
  children,
  style,
  pressedScale = 0.985,
  onPressIn,
  onPressOut,
  ...rest
}: AnimatedPressableProps) {
  // Shared value runs on the UI thread — no JS bridge round-trip needed
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <ReanimatedPressable
      {...rest}
      style={[style, animatedStyle]}
      onPressIn={(event) => {
        // Shrink quickly on finger-down for instant tactile feedback
        scale.value = withTiming(pressedScale, { duration: 110 });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        // Spring back slightly slower so the release feels natural
        scale.value = withTiming(1, { duration: 150 });
        onPressOut?.(event);
      }}
    >
      {children}
    </ReanimatedPressable>
  );
}
