// History-mode action block for the ride-detail screen: trip-state badge plus the
// contextual actions (cancel trip / cancel booking / rate driver / report driver) and
// their success states. Presentational — the screen owns the state and opens the modals.

import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Text, View } from 'react-native';

import AnimatedPressable from '@/components/shared/animated-pressable';
import { Brand, Fonts } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { makeStyles } from '../../styles/app/ride-detail.styles';

type RideDetailStyles = ReturnType<typeof makeStyles>;
type AppColors = ReturnType<typeof useAppTheme>['colors'];

const SuccessBanner = ({ color, icon, text }: { color: string; icon: any; text: string }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, backgroundColor: color + '22' }}>
    <Ionicons name={icon} size={18} color={color} />
    <Text style={{ fontFamily: Fonts.heading, fontSize: 13, color, flex: 1 }}>{text}</Text>
  </View>
);

export default function HistoryActions({
  tripState, isDriverOwn,
  cancelSuccess, onOpenCancelTrip,
  canCancelBooking, passengerCancelSuccess, onOpenCancelBooking,
  canRate, alreadyRated, ratingSuccess, onOpenRating,
  canReportDriver, driverReportSent, onOpenReport,
  styles, colors,
}: {
  tripState?: string;
  isDriverOwn: boolean;
  cancelSuccess: boolean;
  onOpenCancelTrip: () => void;
  canCancelBooking: boolean;
  passengerCancelSuccess: boolean;
  onOpenCancelBooking: () => void;
  canRate: boolean;
  alreadyRated: boolean;
  ratingSuccess: boolean;
  onOpenRating: () => void;
  canReportDriver: boolean;
  driverReportSent: boolean;
  onOpenReport: () => void;
  styles: RideDetailStyles;
  colors: AppColors;
}) {
  const badgeColor =
    tripState === 'completed' ? Brand.colors.green.normal
    : tripState === 'cancelled' ? '#e53e3e'
    : tripState === 'scheduled' ? '#f4a522'
    : Brand.colors.green.normal;
  const badgeIcon =
    tripState === 'completed' ? 'checkmark-circle'
    : tripState === 'cancelled' ? 'close-circle'
    : tripState === 'scheduled' ? 'time-outline'
    : 'ellipse';
  const badgeLabel =
    tripState === 'completed' ? 'Viaje completado'
    : tripState === 'cancelled' ? 'Viaje cancelado'
    : tripState === 'scheduled' ? 'Próximo'
    : tripState === 'in_progress' ? 'En curso'
    : tripState === 'boarding' ? 'Abordaje'
    : tripState;

  return (
    <Animated.View entering={FadeInDown.duration(240).delay(230)} style={{ marginHorizontal: 16, marginTop: 8, gap: 10 }}>
      {/* State badge */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6,
        paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
        backgroundColor:
          tripState === 'completed' ? Brand.colors.green.normal + '22'
          : tripState === 'cancelled' ? '#e53e3e22'
          : tripState === 'scheduled' ? '#f4a52222'
          : colors.border,
      }}>
        <Ionicons name={badgeIcon as any} size={16} color={badgeColor} />
        <Text style={{
          fontFamily: Fonts.headingBold, fontSize: 13,
          color: tripState === 'completed' ? Brand.colors.green.normal : tripState === 'cancelled' ? '#e53e3e' : colors.textMuted,
        }}>
          {badgeLabel}
        </Text>
      </View>

      {/* Cancel trip — scheduled driver trips */}
      {isDriverOwn && tripState === 'scheduled' && !cancelSuccess && (
        <AnimatedPressable
          pressedScale={0.97}
          style={[styles.reserveBtn, { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#e53e3e' }]}
          onPress={onOpenCancelTrip}
        >
          <Ionicons name="close-circle-outline" size={16} color="#fff" />
          <Text style={[styles.reserveBtnText, { color: '#fff' }]}>Cancelar viaje</Text>
        </AnimatedPressable>
      )}
      {cancelSuccess && <SuccessBanner color="#e53e3e" icon="checkmark-circle" text="Viaje cancelado. Los pasajeros han sido notificados." />}

      {/* Cancel booking — passenger, scheduled/boarding trips */}
      {canCancelBooking && !passengerCancelSuccess && (
        <>
          <AnimatedPressable
            pressedScale={0.97}
            style={[styles.reserveBtn, { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#e53e3e' }]}
            onPress={onOpenCancelBooking}
          >
            <Ionicons name="close-circle-outline" size={16} color="#fff" />
            <Text style={[styles.reserveBtnText, { color: '#fff' }]}>Cancelar reserva</Text>
          </AnimatedPressable>
          <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 8 }}>
            Cancelaciones con menos de 30 min de anticipación pueden afectar tu calificación.
          </Text>
        </>
      )}
      {passengerCancelSuccess && <SuccessBanner color="#e53e3e" icon="checkmark-circle" text="Reserva cancelada. El conductor ha sido notificado." />}

      {/* Rating */}
      {canRate && (
        alreadyRated || ratingSuccess ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, backgroundColor: Brand.colors.green.normal + '18' }}>
            <Ionicons name="star" size={18} color={Brand.colors.green.normal} />
            <Text style={{ fontFamily: Fonts.heading, fontSize: 14, color: Brand.colors.green.normal }}>Ya calificaste al conductor</Text>
          </View>
        ) : (
          <AnimatedPressable
            pressedScale={0.97}
            style={[styles.reserveBtn, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}
            onPress={onOpenRating}
          >
            <Ionicons name="star-outline" size={16} color={Brand.colors.black.b1} />
            <Text style={styles.reserveBtnText}>Calificar al conductor</Text>
          </AnimatedPressable>
        )
      )}

      {/* Report driver — completed trips */}
      {canReportDriver && (
        driverReportSent ? (
          <SuccessBanner color="#f4a522" icon="checkmark-circle" text="Reporte enviado. El equipo de Jalemos lo revisará." />
        ) : (
          <AnimatedPressable
            pressedScale={0.97}
            style={[styles.reserveBtn, { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f4a522' }]}
            onPress={onOpenReport}
          >
            <Ionicons name="flag-outline" size={16} color="#fff" />
            <Text style={[styles.reserveBtnText, { color: '#fff' }]}>Reportar conductor</Text>
          </AnimatedPressable>
        )
      )}
    </Animated.View>
  );
}
