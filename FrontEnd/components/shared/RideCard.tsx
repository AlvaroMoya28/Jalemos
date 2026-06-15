// Card component used to display a single available ride in the search results list.
// Tapping it fires a press animation and calls the onPress prop to open the ride detail screen.
// Text and border colors adapt automatically to the device light/dark mode setting.
// Updated by Claude Sonnet 4.6: trip status row (Completado / Cancelado) for the My Rides history.

import AnimatedPressable from "./animated-pressable";
import GlassCard from "./glass-card";
import { Brand } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { Ionicons } from "@expo/vector-icons";
import { useMemo } from "react";
import { Text, View } from "react-native";
import { makeStyles } from "./styles/RideCard.styles";

export interface Ride {
  id: string;
  from: string;
  to: string;
  date: string;
  time: string;
  price: number;
  seats: number;
  driver: string;
  rating: number;
  /** Two-letter avatar initials derived from the driver's name. */
  avatar: string;
  /** Whether the current user is already booked on this ride */
  userBooked?: boolean;
  /** Optional status label shown at the bottom of the card (e.g. "Completado") */
  statusLabel?: string;
  /** Color for the status dot and text */
  statusColor?: string;
}

interface RideCardProps {
  ride: Ride;
  onPress?: () => void;
  /** Context where the card is rendered: affects the seats label */
  mode?: 'search' | 'my-rides';
}

export default function RideCard({ ride, onPress, mode = 'search' }: RideCardProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  // Construct the seats label based on the mode and number of seats, with proper pluralization
  const seatsLabel =
    mode === 'my-rides'
      ? `${ride.seats} ${ride.seats === 1 ? 'lugar reservado' : 'lugares reservados'}`
      : `${ride.seats} ${ride.seats === 1 ? 'lugar disponible' : 'lugares disponibles'}`;

  return (
    <AnimatedPressable pressedScale={0.992} onPress={onPress}>
      <GlassCard style={styles.card} intensity={34}>
        <View style={styles.rowTop}>
          <View style={styles.routeBlock}>
            <View style={styles.routeRow}>
              <View style={styles.originDot} />
              <Text
                style={styles.routeText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {ride.from}
              </Text>
            </View>
            <View style={styles.routeConnector} />
            <View style={styles.routeRow}>
              <Ionicons
                name="location"
                size={11}
                color={Brand.colors.green.normal}
              />
              <Text
                style={styles.routeText}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {ride.to}
              </Text>
            </View>
          </View>

          <View style={styles.priceBlock}>
            <View style={styles.pricePill}>
              <Text style={styles.pricePillText}>
                ₡{ride.price.toLocaleString()}
              </Text>
            </View>
            <Text style={styles.caption}>Por persona</Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Ionicons
              name="time-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.detailText}>
              {ride.date} · {ride.time}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons
              name="people-outline"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.detailText}>{seatsLabel}</Text>
          </View>
        </View>

        <View style={styles.driverRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{ride.avatar}</Text>
          </View>
          <Text style={styles.driverName}>{ride.driver}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#f7a900" />
            <Text style={styles.ratingText}>{ride.rating}</Text>
          </View>
        </View>

        {ride.statusLabel && (
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: ride.statusColor ?? '#aaa' }]} />
            <Text style={[styles.statusText, { color: ride.statusColor ?? '#aaa' }]}>
              {ride.statusLabel}
            </Text>
          </View>
        )}
      </GlassCard>
    </AnimatedPressable>
  );
}
