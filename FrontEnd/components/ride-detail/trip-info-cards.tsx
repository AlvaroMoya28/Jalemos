// Presentational trip-info / driver / vehicle cards for the ride-detail screen.
// Pure: driven entirely by the `ride` model.

import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Text, View } from 'react-native';

import GlassCard from '@/components/shared/glass-card';
import StarRating from '@/components/ride-detail/star-rating';
import type { RideDetail } from '@/components/ride-detail/types';
import { Brand, Fonts } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { makeStyles } from '../../styles/app/ride-detail.styles';

type RideDetailStyles = ReturnType<typeof makeStyles>;
type AppColors = ReturnType<typeof useAppTheme>['colors'];

export default function TripInfoCards({ ride, styles, colors }: {
  ride: RideDetail;
  styles: RideDetailStyles;
  colors: AppColors;
}) {
  return (
    <>
      {/* Trip info card */}
      <Animated.View entering={FadeInDown.duration(240).delay(60)}>
        <GlassCard style={styles.card} intensity={34}>
          <View style={styles.routeRow}>
            <View style={styles.routeLine}>
              <View style={styles.routeDot} />
              <View style={styles.routeConnector} />
              <Ionicons name="location" size={14} color={Brand.colors.green.normal} />
            </View>
            <View style={styles.routePlaces}>
              <View style={styles.routePlaceBlock}>
                <Text style={styles.routeLabel}>Origen</Text>
                <Text style={styles.routePlace}>{ride.from}</Text>
              </View>
              <View style={styles.routePlaceBlock}>
                <Text style={styles.routeLabel}>Destino</Text>
                <Text style={styles.routePlace}>{ride.to}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailGrid}>
            <View style={styles.detailCell}>
              <Ionicons style={styles.detailIcon} name="calendar-outline" size={16} color={Brand.colors.green.dark} />
              <Text style={styles.detailLabel}>Fecha</Text>
              <Text style={styles.detailValue}>{ride.date}</Text>
            </View>
            <View style={[styles.detailCell, styles.detailCellRight]}>
              <Ionicons style={styles.detailIcon} name="time-outline" size={16} color={Brand.colors.green.dark} />
              <Text style={styles.detailLabel}>Hora</Text>
              <Text style={styles.detailValue}>{ride.time}</Text>
            </View>
            <View style={[styles.detailCell, styles.detailCellBottom]}>
              <Ionicons style={styles.detailIcon} name="people-outline" size={16} color={Brand.colors.green.dark} />
              <Text style={styles.detailLabel}>Espacios libres</Text>
              <Text style={styles.detailValue}>
                {ride.availableSeats}{' '}
                <Text style={{ color: colors.textMuted, fontSize: 13, fontFamily: Fonts.sans }}>
                  de {ride.totalSeats}
                </Text>
              </Text>
            </View>
            <View style={[styles.detailCell, styles.detailCellRight, styles.detailCellBottom]}>
              <Ionicons style={styles.detailIcon} name="cash-outline" size={16} color={Brand.colors.green.dark} />
              <Text style={styles.detailLabel}>Por persona</Text>
              <Text style={[styles.detailValue, styles.detailValueGreen]}>₡{ride.price.toLocaleString()}</Text>
            </View>
          </View>

          {ride.notes ? (
            <>
              <View style={styles.divider} />
              <View style={styles.notesRow}>
                <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
                <Text style={styles.notesText}>{ride.notes}</Text>
              </View>
            </>
          ) : null}
        </GlassCard>
      </Animated.View>

      {/* Driver card */}
      <Animated.View entering={FadeInDown.duration(240).delay(130)}>
        <GlassCard style={styles.card} intensity={34}>
          <View style={styles.driverHeader}>
            <View style={styles.driverAvatar}>
              <Text style={styles.driverAvatarText}>{ride.driver.avatar}</Text>
            </View>
            <View style={styles.driverInfo}>
              <View style={styles.driverNameRow}>
                <Text style={styles.driverName}>{ride.driver.fullName}</Text>
                {ride.driver.verified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="checkmark-circle" size={12} color={Brand.colors.green.normal} />
                    <Text style={styles.verifiedText}>Verificado</Text>
                  </View>
                )}
              </View>
              <View style={styles.driverRatingRow}>
                <StarRating rating={ride.driver.rating} size={13} />
                <Text style={styles.driverRatingText}>{ride.driver.rating} ({ride.driver.ratingsCount})</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statsRow}>
            <View style={styles.statCell}>
              <Text style={styles.statValue}>{ride.driver.tripsCompleted}</Text>
              <Text style={styles.statLabel}>Viajes</Text>
            </View>
            <View style={[styles.statCell, styles.statCellDivider]}>
              <Text style={styles.statValue}>{ride.driver.memberSince}</Text>
              <Text style={styles.statLabel}>Miembro desde</Text>
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      {/* Vehicle card */}
      {(ride.driver.vehicle || ride.driver.plate) ? (
        <Animated.View entering={FadeInDown.duration(240).delay(165)}>
          <GlassCard style={styles.card} intensity={34}>
            <View style={styles.vehicleRow}>
              <View style={styles.vehicleIconWrap}>
                <Ionicons name="car-sport-outline" size={22} color={Brand.colors.green.dark} />
              </View>
              <View style={styles.vehicleInfo}>
                <Text style={styles.vehicleModel} numberOfLines={1}>
                  {ride.driver.vehicle || 'Vehículo sin modelo'}
                </Text>
                {ride.driver.plate ? (
                  <View style={styles.vehiclePlateBadge}>
                    <Text style={styles.vehiclePlateText}>{ride.driver.plate}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </GlassCard>
        </Animated.View>
      ) : null}
    </>
  );
}
