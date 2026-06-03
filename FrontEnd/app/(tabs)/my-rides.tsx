// My Rides screen — shows the user's personal trip history.
// Follows the same hero-banner + rounded bottom surface visual pattern
// as the Search and Offer screens for consistency.

import GlassCard from "@/components/glass-card";
import NotificationsModal from "@/components/NotificationsModal";
import RideCard, { Ride } from "@/components/RideCard";
import { Brand } from "@/constants/theme";
import { useAuth } from "@/contexts/auth";
import { useTrips } from "@/contexts/trips";
import { useAppTheme } from "@/hooks/use-app-theme";
import { Trip as TripModel } from "@/hooks/use-trips-data";
import { bookingsApi } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { myRidesInline, makeStyles } from "../../styles/tabs/my-rides.styles";

// For now the app doesn't have the funcionality to mark trips as completed.
// Once that is implemented, we can use this function to compute the status of each trip based on its departure date and completion flag.
// type Status = "completed" | "upcoming" | "cancelled";

// function statusStyle(status: Status) {
//   if (status === "completed")
//     return {
//       label: "Completado",
//       bg: Brand.colors.green.light,
//       color: Brand.colors.green.dark,
//     };
//   if (status === "upcoming")
//     return {
//       label: "Próximo",
//       bg: Brand.colors.blue.light,
//       color: Brand.colors.blue.dark,
//     };
//   return {
//     label: "Cancelado",
//     bg: "#fde6e5",
//     color: Brand.colors.alerts.error,
//   };
// }
export default function MyRidesScreen() {
  const { isDark, colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const router = useRouter();
  useEffect(() => {
    navigation.setOptions({ title: "Mis Viajes", icon: { sf: "briefcase" } });
  }, [navigation]);

  const [notifOpen, setNotifOpen] = useState(false);
  const [tab, setTab] = useState<"passenger" | "driver">("passenger");
  const [onlyCompleted, setOnlyCompleted] = useState(false);

  const { trips, refreshTrips } = useTrips();
  const { user, token } = useAuth();
  const [bookings, setBookings] = useState<any[] | null>(null);

  // Refresh trips and bookings every time the screen is focused, to ensure we show the latest data. 
  useFocusEffect(
    useCallback(() => {
      refreshTrips();
      let mounted = true;
      (async () => {
        if (!token) {
          setBookings([]);
          return;
        }
        try {
          const list = await bookingsApi.getAll(token);
          if (!mounted) return;
          setBookings(Array.isArray(list) ? list : []);
        } catch {
          if (mounted) setBookings([]);
        }
      })();

      return () => {
        mounted = false;
      };
    }, [refreshTrips, token]),
  );

  // Compute totals from real data. For now no trips are 'completed', so totals are 0.
  const totalSpent = useMemo(() => {
    if (!bookings || !trips || !user) return 0;
    return bookings.reduce((acc, b: any) => {
      if (b.passengerId !== user.id) return acc;
      const trip = trips.find((t) => t.id === b.tripId);
      if (!trip) return acc;
      const seats = typeof b.seatsReserved === "number" ? b.seatsReserved : 1;
      return acc + seats * (trip.rate ?? 0);
    }, 0);
  }, [bookings, trips, user]);

  const totalEarned = useMemo(() => {
    if (!trips || !user) return 0;
    return trips.reduce((acc, t) => {
      if (t.driverId !== user.id) return acc;
      // no completed trips yet
      return acc;
    }, 0);
  }, [trips, user]);

  // Build lists for display
  const driverTrips = useMemo<TripModel[]>(
    () => (trips ? trips.filter((t) => t.driverId === user?.id) : []),
    [trips, user],
  );
  const passengerTrips = useMemo<TripModel[]>(() => {
    if (!bookings || !trips) return [];
    const ids = new Set(
      bookings
        .filter((b: any) => b.passengerId === user?.id)
        .map((b: any) => b.tripId),
    );
    return trips.filter((t) => ids.has(t.id));
  }, [bookings, trips, user]);

  const sourceDisplayTrips: TripModel[] =
    tab === "passenger" ? passengerTrips : driverTrips;
  const displayTrips = onlyCompleted
    ? sourceDisplayTrips.filter(() => false /* no completed yet */)
    : sourceDisplayTrips;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={myRidesInline.scrollContentPadding}
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: colors.bottomSurface }}
      >
        {/* Hero banner — same pattern as Search and Offer */}
        <View style={styles.heroWrap}>
          <Image
            source={
              isDark
                ? require("../../assets/images/hero-banner-dark.jpg")
                : require("../../assets/images/hero-banner.jpg")
            }
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay} />
          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroMini}>Pura Vida</Text>
              <Text style={styles.heroTitle}>Mis viajes</Text>
            </View>
            <Pressable
              onPress={() => setNotifOpen(true)}
              style={styles.bellBtn}
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color="#ecfff9"
              />
              <View style={styles.bellDot} />
            </Pressable>
          </View>
        </View>

        {/* Rounded bottom surface */}
        <View style={styles.bottomSurface}>
          {/* Stats cards */}
          <View style={styles.statsRow}>
            <GlassCard style={styles.statCard} intensity={34}>
              <Text style={styles.statLabel}>Gastado</Text>
              <Text style={styles.statValue}>
                ₡{totalSpent.toLocaleString()}
              </Text>
            </GlassCard>
            <GlassCard style={styles.statCard} intensity={34}>
              <Text style={styles.statLabel}>Ganado</Text>
              <Text style={styles.statValueGreen}>
                ₡{totalEarned.toLocaleString()}
              </Text>
            </GlassCard>
          </View>

          {/* Passenger / driver toggle */}
          <View style={styles.segment}>
            <Pressable
              style={[
                styles.segmentBtn,
                tab === "passenger" && styles.segmentBtnActive,
              ]}
              onPress={() => setTab("passenger")}
            >
              <Text
                style={[
                  styles.segmentText,
                  tab === "passenger" && styles.segmentTextActive,
                ]}
              >
                Como pasajero
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.segmentBtn,
                tab === "driver" && styles.segmentBtnActive,
              ]}
              onPress={() => setTab("driver")}
            >
              <Text
                style={[
                  styles.segmentText,
                  tab === "driver" && styles.segmentTextActive,
                ]}
              >
                Como conductor
              </Text>
            </Pressable>
          </View>

          {/* Filters */}
          <View style={styles.filtersRow}>
            <Pressable
              style={styles.radioRow}
              onPress={() => setOnlyCompleted(false)}
            >
              <View
                style={[
                  styles.radioOuter,
                  !onlyCompleted && styles.radioOuterActive,
                ]}
              >
                {!onlyCompleted ? <View style={styles.radioInner} /> : null}
              </View>
              <Text style={styles.radioText}>Todos</Text>
            </Pressable>

            <Pressable
              style={styles.radioRow}
              onPress={() => setOnlyCompleted(true)}
            >
              <View
                style={[
                  styles.checkBox,
                  onlyCompleted && styles.checkBoxActive,
                ]}
              >
                {onlyCompleted ? (
                  <Ionicons
                    name="checkmark"
                    size={14}
                    color={Brand.colors.black.b1}
                  />
                ) : null}
              </View>
              <Text style={styles.radioText}>Solo completados</Text>
            </Pressable>
          </View>

          {/* Trip list */}
          <View style={styles.tripList}>
            {displayTrips.length > 0 ? (
              displayTrips.map((t) => {
                const dep = new Date(
                  t.departureAt ?? t.departureAt ?? Date.now(),
                );
                const nameParts = (t.driverName ?? "").split(" ");
                const firstName = nameParts[0] ?? "";
                const avatar =
                  `${firstName[0] ?? ""}${nameParts[1]?.[0] ?? ""}`.toUpperCase();
                // Determine seats to display:
                // - In passenger tab: seats reserved by the current user for this trip
                // - In driver tab: total seats reserved by passengers for this trip
                // - Fallback: available seats
                let seatsCount = t.availableSeats ?? t.totalSeats ?? 1;
                if (tab === "passenger") {
                  const myBooking = (bookings || []).find(
                    (b: any) => b.tripId === t.id && b.passengerId === user?.id,
                  );
                  seatsCount =
                    typeof myBooking?.seatsReserved === "number"
                      ? myBooking.seatsReserved
                      : seatsCount;
                } else {
                  const totalReserved = (bookings || [])
                    .filter((b: any) => b.tripId === t.id)
                    .reduce(
                      (acc: number, b: any) =>
                        acc +
                        (typeof b.seatsReserved === "number"
                          ? b.seatsReserved
                          : 1),
                      0,
                    );
                  // if there are any reservations, show that number; otherwise fallback to seatsCount
                  if (totalReserved > 0) seatsCount = totalReserved;
                }

                const ride: Ride = {
                  id: t.id,
                  from: t.origin ?? t.origin ?? "Origen",
                  to: t.destination ?? t.destination ?? "Destino",
                  date: dep.toLocaleDateString("es-CR", {
                    day: "numeric",
                    month: "short",
                  }),
                  time: dep.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                  price: t.rate ?? 0,
                  seats: seatsCount,
                  driver: t.driverName ?? "Conductor",
                  rating: t.driverRating ?? 0,
                  avatar,
                };
                const isExpired = tab === 'driver' && dep < new Date();
                return (
                  <View key={t.id} style={myRidesInline.tripCardWrapper}>
                    {isExpired && (
                      <View style={myRidesInline.expiredBadge}>
                        <Text style={myRidesInline.expiredBadgeText}>Vencido</Text>
                      </View>
                    )}
                    <RideCard
                      ride={ride}
                      mode="my-rides"
                      onPress={() =>
                        router.push({
                          pathname: "/ride-detail",
                          params: { id: t.id },
                        })
                      }
                    />
                  </View>
                );
              })
            ) : (
              <Text style={styles.metaText}>No hay viajes para mostrar</Text>
            )}
          </View>
        </View>
      </ScrollView>

      <NotificationsModal
        visible={notifOpen}
        onClose={() => setNotifOpen(false)}
      />
    </View>
  );
}
