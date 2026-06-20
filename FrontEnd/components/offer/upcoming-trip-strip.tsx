// Collapsible strip shown on the Offer tab when the driver has a trip departing
// within 60 minutes, with the "Iniciar abordaje" action once the window opens.

import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';

import { Brand } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { UpcomingTrip } from '@/hooks/use-upcoming-trip';
import { upcomingStyles } from '@/styles/tabs/offer.styles';

export default function UpcomingTripStrip({
  trip, minsUntilBoarding, expanded, onToggle, startLoading, onStartBoarding, colors,
}: {
  trip: UpcomingTrip;
  minsUntilBoarding: number | null;
  expanded: boolean;
  onToggle: () => void;
  startLoading: boolean;
  onStartBoarding: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const ready = minsUntilBoarding === 0;
  const accent = ready ? Brand.colors.green.normal : '#f4a522';

  return (
    <View style={[upcomingStyles.strip, { borderColor: colors.border, backgroundColor: colors.inputBg }]}>
      {/* Header row — always visible, tap to toggle expand */}
      <Pressable style={upcomingStyles.stripHeader} onPress={onToggle}>
        <View style={[upcomingStyles.stripDot, { backgroundColor: accent }]} />
        <View style={{ flex: 1 }}>
          <Text style={[upcomingStyles.stripRoute, { color: colors.textPrimary }]} numberOfLines={1}>
            {trip.origin} → {trip.destination}
          </Text>
          <Text style={[upcomingStyles.stripMeta, { color: accent }]}>
            {ready ? '¡Listo para abordar!' : `Sale en ${minsUntilBoarding} min`}
          </Text>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
      </Pressable>

      {/* Expandable section — departure details + boarding button */}
      {expanded && (
        <Animated.View entering={FadeInDown.duration(180)} exiting={FadeOut.duration(120)}>
          <View style={[upcomingStyles.stripDivider, { backgroundColor: colors.border }]} />
          <View style={upcomingStyles.stripBody}>
            <Text style={[upcomingStyles.stripTime, { color: colors.textSecondary }]}>
              {new Date(trip.departureAt).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}
              {' · '}
              {new Date(trip.departureAt).toLocaleDateString('es-CR', { weekday: 'short', day: 'numeric', month: 'short' })}
            </Text>
            <Pressable
              style={[
                upcomingStyles.stripBtn,
                { backgroundColor: ready ? Brand.colors.green.normal : colors.border },
                startLoading && { opacity: 0.6 },
              ]}
              onPress={onStartBoarding}
              disabled={startLoading || !ready}
            >
              <Ionicons name="car-sport" size={15} color={ready ? '#fff' : colors.textMuted} />
              <Text style={[upcomingStyles.stripBtnText, { color: ready ? '#fff' : colors.textMuted }]}>
                {startLoading ? 'Iniciando…' : ready ? 'Iniciar abordaje' : 'No disponible aún'}
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      )}
    </View>
  );
}
