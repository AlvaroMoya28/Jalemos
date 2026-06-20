// Bottom surface of the Search screen: quick filters, popular-route shortcuts, and the
// filtered list of rides (with its empty states). Presentational — handlers come from
// the parent (useTripSearch).

import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';

import RideCard, { Ride } from '@/components/shared/RideCard';
import { Brand } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { QUICK_ROUTES } from '@/hooks/use-trip-search';
import { makeStyles } from '@/styles/tabs/search.styles';

type SearchStyles = ReturnType<typeof makeStyles>;
type AppColors = ReturnType<typeof useAppTheme>['colors'];

interface Props {
  hasSearched: boolean;
  filteredRides: Ride[];
  noTripsExist: boolean;
  onRidePress: (id: string) => void;
  onClear: () => void;
  onRefresh: () => void;
  applyQuickRoute: (from: string, to: string) => void;
  styles: SearchStyles;
  colors: AppColors;
}

export default function RideResults({
  hasSearched, filteredRides, noTripsExist, onRidePress, onClear, onRefresh, applyQuickRoute, styles, colors,
}: Props) {
  return (
    <View style={styles.bottomSurface}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickFilters} contentContainerStyle={styles.quickFiltersContent}>
        <Pressable style={styles.filterBtn}>
          <Ionicons name="locate-outline" size={14} color={Brand.colors.green.dark} />
          <Text style={styles.filterText}>Cerca de mí</Text>
        </Pressable>
        <Pressable style={styles.filterBtn}>
          <Ionicons name="calendar-outline" size={14} color={Brand.colors.green.dark} />
          <Text style={styles.filterText}>Hoy</Text>
        </Pressable>
        <Pressable style={styles.filterBtn}>
          <Text style={styles.filterText}>Más baratos</Text>
        </Pressable>
      </ScrollView>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rutas populares</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.routesRow}>
          {QUICK_ROUTES.map((route) => (
            <Pressable key={`${route.from}-${route.to}`} style={styles.routeChip} onPress={() => applyQuickRoute(route.from, route.to)}>
              <Text style={styles.routeChipText}>{route.from} - {route.to}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {hasSearched
              ? `${filteredRides.length} resultado${filteredRides.length !== 1 ? 's' : ''}`
              : 'Viajes disponibles'}
          </Text>
          {hasSearched && (
            <Pressable onPress={onClear}>
              <Text style={styles.sectionLink}>Ver todos</Text>
            </Pressable>
          )}
        </View>

        {filteredRides.length > 0 ? (
          <View style={styles.rideList}>
            {filteredRides.map((ride) => (
              <RideCard key={ride.id} ride={ride} mode="search" onPress={() => onRidePress(ride.id)} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {noTripsExist
                ? 'Aún no hay viajes publicados.'
                : hasSearched
                  ? 'No hay viajes para esa ruta.'
                  : 'No hay viajes disponibles en este momento.'}
            </Text>
            {noTripsExist ? (
              <Pressable onPress={onRefresh}>
                <Text style={styles.sectionLink}>Actualizar</Text>
              </Pressable>
            ) : hasSearched ? (
              <Pressable onPress={onClear}>
                <Text style={styles.sectionLink}>Ver todos los viajes</Text>
              </Pressable>
            ) : (
              <Pressable onPress={onRefresh}>
                <Text style={styles.sectionLink}>Actualizar</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
