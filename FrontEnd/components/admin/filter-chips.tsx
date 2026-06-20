// Shared filter-chip row for the admin panels. Renders a horizontal,
// wrapping set of selectable chips. Each admin screen owns its own styles
// (with `chipsRow`, `filterChip`, `filterChipText`) and passes them in so the
// chips inherit the panel's look.

import { Pressable, StyleProp, Text, TextStyle, View, ViewStyle } from 'react-native';

import { Brand } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

type ChipStyles = {
  chipsRow: StyleProp<ViewStyle>;
  filterChip: StyleProp<ViewStyle>;
  filterChipText: StyleProp<TextStyle>;
};

export interface FilterChipOption<K extends string> {
  key: K;
  label: string;
}

export default function FilterChips<K extends string>({
  options,
  value,
  onChange,
  styles,
  colors,
}: {
  options: readonly FilterChipOption<K>[];
  value: K;
  onChange: (key: K) => void;
  styles: ChipStyles;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <View style={styles.chipsRow}>
      {options.map((opt) => {
        const active = value === opt.key;
        return (
          <Pressable
            key={opt.key}
            style={[styles.filterChip, {
              backgroundColor: active ? Brand.colors.green.normal : colors.surfaceAlt,
              borderColor: active ? Brand.colors.green.normal : colors.border,
            }]}
            onPress={() => onChange(opt.key)}
          >
            <Text style={[styles.filterChipText, { color: active ? '#fff' : colors.textSecondary }]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
