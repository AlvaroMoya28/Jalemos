// My Rides screen — shows the user's personal trip history.
// Follows the same hero-banner + rounded bottom surface visual pattern
// as the Search and Offer screens for consistency.

import GlassCard from "@/components/glass-card";
import NotificationsModal from "@/components/NotificationsModal";
import RideCard, { Ride } from "@/components/RideCard";
import { Brand, Fonts, withElevation } from "@/constants/theme";
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
  StyleSheet,
  Text,
  View,
} from "react-native";

const HERO_HEIGHT = 200;

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

function makeStyles(c: ReturnType<typeof useAppTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.screenBg,
    },
    heroWrap: {
      height: HERO_HEIGHT,
      position: "relative",
    },
    heroImage: {
      width: "100%",
      height: HERO_HEIGHT,
    },
    heroOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(10, 63, 57, 0.38)",
    },
    heroHeader: {
      position: "absolute",
      top: 58,
      left: Brand.grid.margin,
      right: Brand.grid.margin,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    bellBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.3)",
    },
    bellDot: {
      position: "absolute",
      top: 10,
      right: 10,
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: "#ffb13e",
    },
    heroMini: {
      color: Brand.colors.green.light,
      fontSize: 13,
      fontFamily: Fonts.heading,
    },
    heroTitle: {
      color: Brand.colors.black.b1,
      fontSize: 32,
      fontFamily: Fonts.headingHeavy,
    },
    bottomSurface: {
      backgroundColor: c.bottomSurface,
      borderTopLeftRadius: Brand.radius[24],
      borderTopRightRadius: Brand.radius[24],
      marginTop: -4,
      paddingTop: 18,
      paddingBottom: 24,
    },
    statsRow: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: Brand.grid.margin,
      marginBottom: 14,
    },
    statCard: {
      flex: 1,
      borderRadius: Brand.radius[16],
      padding: 12,
      ...withElevation(100),
    },
    statLabel: {
      fontSize: 11,
      color: c.textMuted,
      fontFamily: Fonts.sans,
    },
    statValue: {
      marginTop: 2,
      fontSize: 22,
      fontFamily: Fonts.headingHeavy,
      color: c.textPrimary,
    },
    statValueGreen: {
      marginTop: 2,
      fontSize: 22,
      fontFamily: Fonts.headingHeavy,
      color: Brand.colors.green.normal,
    },
    segment: {
      flexDirection: "row",
      backgroundColor: c.segmentBg,
      borderRadius: Brand.radius[12],
      padding: 4,
      marginHorizontal: Brand.grid.margin,
    },
    segmentBtn: {
      flex: 1,
      borderRadius: 10,
      paddingVertical: 8,
      alignItems: "center",
    },
    segmentBtnActive: {
      backgroundColor: c.segmentActiveBg,
    },
    segmentText: {
      color: c.textSecondary,
      fontSize: 12,
      fontFamily: Fonts.heading,
    },
    segmentTextActive: {
      color: Brand.colors.green.normal,
    },
    filtersRow: {
      marginTop: 12,
      marginHorizontal: Brand.grid.margin,
      flexDirection: "row",
      gap: 16,
      alignItems: "center",
    },
    radioRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    radioOuter: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: Brand.colors.green.normal,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.radioOuterBg,
    },
    radioOuterActive: {
      backgroundColor: Brand.colors.green.light,
    },
    radioInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: Brand.colors.green.normal,
    },
    checkBox: {
      width: 28,
      height: 28,
      borderRadius: Brand.radius[4],
      borderWidth: 2,
      borderColor: Brand.colors.green.normal,
      alignItems: "center",
      justifyContent: "center",
    },
    checkBoxActive: {
      backgroundColor: Brand.colors.green.normal,
    },
    radioText: {
      fontSize: 12,
      color: c.textPrimary,
      fontFamily: Fonts.heading,
    },
    tripList: {
      marginTop: 12,
      paddingHorizontal: Brand.grid.margin,
      gap: 10,
    },
    tripCard: {
      borderRadius: Brand.radius[16],
      padding: 12,
      ...withElevation(100),
    },
    tripTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
    },
    routeWrap: {
      flex: 1,
    },
    routeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    originDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: Brand.colors.green.normal,
    },
    routeConnector: {
      height: 8,
      borderLeftWidth: 2,
      borderLeftColor: c.border,
      marginLeft: 3,
      marginVertical: 3,
    },
    routeText: {
      fontSize: 14,
      fontFamily: Fonts.heading,
      color: c.textPrimary,
    },
    priceWrap: {
      alignItems: "flex-end",
    },
    priceText: {
      fontSize: 18,
      color: Brand.colors.green.normal,
      fontFamily: Fonts.headingHeavy,
    },
    badge: {
      marginTop: 4,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: "700",
    },
    metaRow: {
      marginTop: 8,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    metaText: {
      fontSize: 12,
      color: c.textSecondary,
      fontFamily: Fonts.sans,
    },
    tripBottom: {
      borderTopWidth: 1,
      borderTopColor: c.border,
      marginTop: 9,
      paddingTop: 8,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    tripCounterpart: {
      fontSize: 12,
      color: c.textPrimary,
      fontFamily: Fonts.heading,
    },
    ratingWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
    ratingText: {
      color: c.textPrimary,
      fontSize: 12,
      fontFamily: Fonts.heading,
    },
  });
}

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
        contentContainerStyle={{ paddingBottom: 26 }}
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
                  <View key={t.id} style={{ position: 'relative' }}>
                    {isExpired && (
                      <View style={{
                        position: 'absolute', top: 10, right: 10, zIndex: 10,
                        backgroundColor: Brand.colors.alerts.error,
                        borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3,
                      }}>
                        <Text style={{ color: '#fff', fontSize: 10, fontFamily: Fonts.headingBold }}>Vencido</Text>
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
