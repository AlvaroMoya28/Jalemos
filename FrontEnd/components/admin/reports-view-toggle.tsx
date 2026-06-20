// Segmented control switching between the three reports views.

import { Pressable, Text, View } from 'react-native';

import { Brand, Fonts } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { ViewMode } from '@/hooks/use-admin-reports';

const SEGMENTS: [ViewMode, string][] = [
  ['trip', 'En Viaje'],
  ['ratings', 'Calificaciones'],
  ['user', 'Usuarios'],
];

export default function ReportsViewToggle({ value, onChange, colors }: {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <View style={{ flexDirection: 'row', marginHorizontal: 16, marginTop: 16, marginBottom: 4, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
      {SEGMENTS.map(([key, label]) => (
        <Pressable
          key={key}
          style={{ flex: 1, paddingVertical: 10, alignItems: 'center', backgroundColor: value === key ? Brand.colors.green.normal : 'transparent' }}
          onPress={() => onChange(key)}
        >
          <Text style={{ fontFamily: Fonts.headingBold, fontSize: 12, color: value === key ? '#fff' : colors.textSecondary }}>
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
