// In-progress route map + "open in maps" button for the driver boarding screen.

import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { TripStatusResponse } from '@/services/api';
import { openInMaps } from '@/utils/open-in-maps';
import { styles, mapStyles } from './styles/boarding-screen.styles';

export default function BoardingMap({ trip, mapUrl, mapError, onMapError, colors }: {
  trip: TripStatusResponse;
  mapUrl: string | null;
  mapError: boolean;
  onMapError: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const launch = () => openInMaps(
    Number(trip.originLatitude), Number(trip.originLongitude),
    Number(trip.destinationLatitude), Number(trip.destinationLongitude),
    trip.origin, trip.destination,
  );

  return (
    <>
      <Pressable style={mapStyles.container} onPress={launch}>
        {mapUrl && !mapError ? (
          <Image source={{ uri: mapUrl }} style={mapStyles.image} resizeMode="cover" onError={onMapError} />
        ) : (
          <View style={[mapStyles.fallback, { backgroundColor: colors.inputBg }]}>
            <Ionicons name="map-outline" size={36} color={colors.textMuted} />
            <Text style={[mapStyles.fallbackText, { color: colors.textMuted }]} numberOfLines={1}>
              {trip.origin} → {trip.destination}
            </Text>
          </View>
        )}
        <View style={mapStyles.expandIcon}>
          <Ionicons name="navigate" size={14} color="#fff" />
        </View>
      </Pressable>

      <Pressable
        style={[styles.scanBtn, { backgroundColor: '#3182ce', marginHorizontal: 16, marginBottom: 10 }]}
        onPress={launch}
      >
        <Ionicons name="navigate-outline" size={20} color="#fff" />
        <Text style={styles.scanBtnText}>Abrir en mapa</Text>
      </Pressable>
    </>
  );
}
