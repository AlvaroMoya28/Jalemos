import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';

type AnimatedPressableProps = PressableProps & {
  style?: StyleProp<ViewStyle>;
  pressedScale?: number;
};

const ReanimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function AnimatedPressable({
  children,
  style,
  pressedScale = 0.985,
  onPressIn,
  onPressOut,
  ...rest
}: AnimatedPressableProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <ReanimatedPressable
      {...rest}
      style={[style, animatedStyle]}
      onPressIn={(event) => {
        scale.value = withTiming(pressedScale, { duration: 110 });
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        scale.value = withTiming(1, { duration: 150 });
        onPressOut?.(event);
      }}
    >
      {children}
    </ReanimatedPressable>
  );
}
