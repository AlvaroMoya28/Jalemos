// Hook that resolves a semantic color for the current light/dark color scheme.
// Components pass optional per-theme overrides via props; the hook falls back
// to the global Colors map when no override is provided.

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

/**
 * Returns the correct color value for the active color scheme.
 *
 * @param props  Optional per-theme color overrides: `{ light: '#fff', dark: '#000' }`.
 * @param colorName  Key from the Colors map (e.g. 'text', 'background', 'tint').
 */
export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  // Default to 'light' if the device hasn't reported a preference yet
  const theme: 'light' | 'dark' = useColorScheme() === 'dark' ? 'dark' : 'light';
  const colorFromProps = props[theme];

  // Prefer the explicit override supplied by the component over the global token
  if (colorFromProps) {
    return colorFromProps;
  } else {
    return Colors[theme][colorName];
  }
}
