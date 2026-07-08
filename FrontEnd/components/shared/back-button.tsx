// Single, consistent "back" affordance used across every screen that needs one.
// Same circle, same size, same icon everywhere — only the color tint adapts to
// whether it sits over a light surface or a dark banner/image background.

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { withElevation } from '@/constants/theme';
import { useLoading } from '@/contexts/loading';
import { useAppTheme } from '@/hooks/use-app-theme';

interface Props {
  /** true when placed over a dark banner or ImageBackground; adapts the tint for contrast. */
  dark?: boolean;
  /** Override the default back navigation (rarely needed). */
  onPress?: () => void;
}

export function BackButton({ dark = false, onPress }: Props) {
  const { colors } = useAppTheme();
  const { showLoader, hideLoader } = useLoading();

  const handlePress = onPress ?? (() => {
    showLoader();
    router.back();
    setTimeout(() => hideLoader(), 300);
  });

  return (
    <Pressable
      style={[
        styles.circle,
        withElevation(100),
        dark
          ? styles.circleDark
          : { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
      onPress={handlePress}
      hitSlop={8}
    >
      <Ionicons name="chevron-back" size={20} color={dark ? '#ffffff' : colors.textPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDark: {
    backgroundColor: 'rgba(255,255,255,0.28)',
    borderColor: 'rgba(255,255,255,0.4)',
  },
});
