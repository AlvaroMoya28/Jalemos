// Single passenger row shown in the boarding screen's passenger list.

import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { passengerRowStyles } from './styles/boarding-screen.styles';
import { Brand } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { PassengerSummary } from '@/services/api';

export function PassengerRow({
  passenger, isBoarding, graceElapsed, onMarkNoShow, colors,
}: {
  passenger: PassengerSummary;
  isBoarding: boolean;
  graceElapsed: boolean;
  onMarkNoShow: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const stateIcon: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
    confirmed: { name: 'time-outline',       color: '#f4a522' },
    pending:   { name: 'time-outline',       color: '#f4a522' },
    boarded:   { name: 'checkmark-circle',   color: Brand.colors.green.normal },
    no_show:   { name: 'close-circle',       color: '#e53e3e' },
  };
  const state = stateIcon[passenger.bookingState] ?? { name: 'help-circle', color: '#aaa' };

  return (
    <View style={[passengerRowStyles.row, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
      <Ionicons name={state.name} size={20} color={state.color} />
      <View style={{ flex: 1 }}>
        <Text style={[passengerRowStyles.name, { color: colors.textPrimary }]}>
          {passenger.firstName} {passenger.lastName}
        </Text>
        <Text style={[passengerRowStyles.seats, { color: colors.textSecondary }]}>
          {passenger.seatsReserved} asiento{passenger.seatsReserved > 1 ? 's' : ''}
          {passenger.bookingState === 'boarded' && passenger.boardedAt
            ? ` · Abordó a las ${new Date(passenger.boardedAt).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}`
            : ''}
        </Text>
      </View>
      {isBoarding && (passenger.bookingState === 'confirmed' || passenger.bookingState === 'pending') && graceElapsed && (
        <Pressable onPress={onMarkNoShow} style={passengerRowStyles.noShowBtn} hitSlop={8}>
          <Text style={passengerRowStyles.noShowText}>No llegó</Text>
        </Pressable>
      )}
    </View>
  );
}
