// Single labeled icon/value row used inside the active trip bubble's info cards.

import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { infoRowStyles } from './styles/active-trip-bubble.styles';
import { Brand } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

export function InfoRow({ icon, label, value, colors }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <View style={infoRowStyles.row}>
      <Ionicons name={icon} size={14} color={Brand.colors.green.normal} />
      <Text style={[infoRowStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[infoRowStyles.value, { color: colors.textPrimary }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}
