// Custom bottom-tab button that fires a light haptic pulse on iOS when tapped.
// Android's built-in ripple provides enough tactile feedback natively,
// so haptics are skipped there to avoid double feedback.

import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';

/**
 * Drop-in tab bar button used via tabBarButton in the tab layout.
 * Wraps PlatformPressable to inject haptic feedback on iOS presses.
 */
export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          // Light impact gives a crisp "tap" feel without being obtrusive
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
