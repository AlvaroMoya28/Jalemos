// Convenience hook that returns the active color scheme and the full Colors map
// for that scheme. Import this instead of manually calling useColorScheme() +
// indexing into Colors in every component.

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/** The shape of a single theme color set (light or dark). */
export type AppColors = typeof Colors.light;

/**
 * Returns whether dark mode is active and the matching semantic color map.
 *
 * Usage:
 *   const { isDark, colors } = useAppTheme();
 */
export function useAppTheme() {
  const scheme = useColorScheme() ?? 'light';
  return {
    isDark: scheme === 'dark',
    scheme,
    colors: Colors[scheme] as AppColors,
  };
}
