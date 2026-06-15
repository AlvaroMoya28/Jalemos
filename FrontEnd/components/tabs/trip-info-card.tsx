// Route and driver info cards shown in the active trip bubble's expanded sheet.

import { styles } from './styles/active-trip-bubble.styles';
import { useAppTheme } from '@/hooks/use-app-theme';
import { ActivePassengerTrip } from '@/services/api';
import { View } from 'react-native';
import { InfoRow } from './info-row';

export function TripInfoCard({ trip, colors }: {
  trip: ActivePassengerTrip;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <>
      {/* Route */}
      <View style={[styles.card, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
        <InfoRow icon="radio-button-on" label="Origen"  value={trip.origin}     colors={colors} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <InfoRow icon="location"        label="Destino" value={trip.destination} colors={colors} />
      </View>

      {/* Driver */}
      <View style={[styles.card, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
        <InfoRow icon="person" label="Conductor"    value={`${trip.driverFirstName} ${trip.driverLastName}`} colors={colors} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <InfoRow icon="star"   label="Calificación" value={`${trip.driverRating.toFixed(1)} ★`} colors={colors} />
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <InfoRow icon="cash"   label="Tarifa"       value={`₡${trip.rate.toLocaleString()}`}    colors={colors} />
        {trip.journeyStartedAt && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <InfoRow icon="time" label="Inició" value={new Date(trip.journeyStartedAt).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })} colors={colors} />
          </>
        )}
      </View>
    </>
  );
}
