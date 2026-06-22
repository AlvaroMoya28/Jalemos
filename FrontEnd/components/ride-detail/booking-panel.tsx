// Fixed bottom booking panel (search/scheduled mode): seat counter + total + reserve.
// Presentational — the screen owns the booking state and handler.

import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import AnimatedPressable from '@/components/shared/animated-pressable';
import type { RideDetail } from '@/components/ride-detail/types';
import { Brand } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { makeStyles } from '../../styles/app/ride-detail.styles';

type RideDetailStyles = ReturnType<typeof makeStyles>;
type AppColors = ReturnType<typeof useAppTheme>['colors'];

export default function BookingPanel({
  ride, seats, setSeats, booked, bookingLoading, totalPrice, bottomInset, onReserve, styles, colors,
}: {
  ride: RideDetail;
  seats: number;
  setSeats: (updater: (prev: number) => number) => void;
  booked: boolean;
  bookingLoading: boolean;
  totalPrice: number;
  bottomInset: number;
  onReserve: () => void;
  styles: RideDetailStyles;
  colors: AppColors;
}) {
  return (
    <View style={[styles.bookingPanel, { paddingBottom: bottomInset + 14 }]}>
      <View style={styles.bookingRow}>
        <View style={styles.bookingGroup}>
          <Text style={styles.bookingLabel}>Espacios</Text>
          <View style={styles.seatCounter}>
            <Pressable
              style={[styles.seatBtn, (seats <= 1 || booked) && styles.seatBtnDisabled]}
              onPress={() => setSeats((s) => Math.max(1, s - 1))}
              disabled={seats <= 1 || booked}
            >
              <Ionicons name="remove" size={16} color={seats <= 1 || booked ? colors.textMuted : Brand.colors.black.b1} />
            </Pressable>
            <Text style={[styles.seatNumber, booked && { color: colors.textMuted }]}>{seats}</Text>
            <Pressable
              style={[styles.seatBtn, (seats >= ride.availableSeats || booked) && styles.seatBtnDisabled]}
              onPress={() => setSeats((s) => Math.min(ride.availableSeats, s + 1))}
              disabled={seats >= ride.availableSeats || booked}
            >
              <Ionicons name="add" size={16} color={seats >= ride.availableSeats || booked ? colors.textMuted : Brand.colors.black.b1} />
            </Pressable>
          </View>
        </View>
        <View style={styles.bookingGroup}>
          <Text style={styles.bookingLabel}>Total</Text>
          <Text style={styles.totalPrice}>₡{totalPrice.toLocaleString()}</Text>
        </View>
      </View>
      <AnimatedPressable
        pressedScale={0.98}
        style={[styles.reserveBtn, (bookingLoading || booked) && { opacity: 0.7 }]}
        onPress={onReserve}
        disabled={bookingLoading || booked}
      >
        <Text style={[styles.reserveBtnText, (bookingLoading || booked) && { color: colors.textMuted }]}>
          {booked ? 'Espacio reservado' : bookingLoading ? 'Reservando...' : 'Reservar espacio'}
        </Text>
      </AnimatedPressable>
    </View>
  );
}
