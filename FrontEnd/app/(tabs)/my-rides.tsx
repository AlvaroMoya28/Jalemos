// My Rides screen — shows the user's personal trip history.
// Follows the same hero-banner + rounded bottom surface visual pattern
// as the Search and Offer screens for consistency.

import GlassCard from "@/components/glass-card";
import NotificationsModal from "@/components/NotificationsModal";
import RideCard, { Ride } from "@/components/RideCard";
import { Brand } from "@/constants/theme";
import { useAuth } from "@/contexts/auth";
import { useAppTheme } from "@/hooks/use-app-theme";
import type { Trip as TripModel } from "@/hooks/use-trips-data";

import { bookingsApi, tripsApi, MyBookingDTO } from "@/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { makeStyles, myRidesInline } from "../../styles/tabs/my-rides.styles";

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

  const { user, token } = useAuth();
  // Raw data from the two new history endpoints
  const [myBookings, setMyBookings]   = useState<MyBookingDTO[] | null>(null);
  const [myDriverTrips, setMyDriverTrips] = useState<any[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      let mounted = true;
      (async () => {
        try {
          const [bookingList, driverList] = await Promise.all([
            bookingsApi.getMine(token),
            tripsApi.getMine(token),
          ]);
          if (!mounted) return;
          setMyBookings(Array.isArray(bookingList) ? bookingList : []);
          setMyDriverTrips(Array.isArray(driverList) ? driverList : []);
        } catch {
          if (mounted) { setMyBookings([]); setMyDriverTrips([]); }
        }
      })();
      return () => { mounted = false; };
    }, [token]),
  );

  const totalSpent = useMemo(() => {
    if (!myBookings) return 0;
    return myBookings
      .filter(b => b.bookingState === 'completed')
      .reduce((acc, b) => acc + b.estimatedAmount, 0);
  }, [myBookings]);

  const totalEarned = useMemo(() => {
    if (!myDriverTrips || !user) return 0;
    return myDriverTrips
      .filter((t: any) => t.driverId === user.id && t.state === 'completed')
      .reduce((acc: number, t: any) => acc + (t.rate ?? 0), 0);
  }, [myDriverTrips, user]);

  // ── Display lists ──────────────────────────────────────────────────────────
  // Passenger tab: use MyBookingDTO directly (has embedded trip snapshot)
  const passengerItems: MyBookingDTO[] = useMemo(
    () => myBookings ?? [],
    [myBookings],
  );

  // Driver tab: driver's own trips (all states)
  const driverItems: any[] = useMemo(
    () => myDriverTrips ?? [],
    [myDriverTrips],
  );

  const sourceItems = tab === 'passenger' ? passengerItems : driverItems;
  const displayItems = onlyCompleted
    ? sourceItems.filter((item: any) => {
        const state = (item.tripState ?? item.state ?? '').toLowerCase();
        return state === 'completed';
      })
    : sourceItems;

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
            {displayItems.length > 0 ? (
              displayItems.map((item: any) => {
                // Normalize fields from both MyBookingDTO (passenger) and TripDto (driver)
                const origin      = item.origin      ?? item.from       ?? 'Origen';
                const destination = item.destination ?? item.to         ?? 'Destino';
                const departAt    = item.departureAt ?? item.departureAt;
                const dep         = new Date(departAt ?? Date.now());
                const rate        = item.rate        ?? item.price      ?? 0;
                const driverFirst = item.driverFirstName ?? '';
                const driverLast  = item.driverLastName  ?? '';
                const driverName  = `${driverFirst} ${driverLast}`.trim() || item.driverName || 'Conductor';
                const seats       = item.seatsReserved ?? item.availableSeats ?? 1;
                const tripId      = item.tripId ?? item.id;
                const tripState   = (item.tripState ?? item.state ?? '').toLowerCase();

                const nameParts = driverName.split(' ');
                const avatar    = `${nameParts[0]?.[0] ?? ''}${nameParts[1]?.[0] ?? ''}`.toUpperCase();

                const stateBadge = tripState === 'completed' ? 'Completado'
                  : tripState === 'cancelled' ? 'Cancelado'
                  : tripState === 'in_progress' ? 'En curso'
                  : tripState === 'boarding'  ? 'Abordaje'
                  : null;

                const statusColor =
                  tripState === 'completed'   ? '#1a9e6a'
                  : tripState === 'cancelled' ? '#e53e3e'
                  : tripState === 'in_progress' ? Brand.colors.green.normal
                  : tripState === 'boarding'  ? '#f4a522'
                  : undefined;

                const ride: Ride = {
                  id: tripId,
                  from: origin,
                  to: destination,
                  date: dep.toLocaleDateString('es-CR', { day: 'numeric', month: 'short' }),
                  time: dep.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
                  price: rate,
                  seats,
                  driver: driverName,
                  rating: item.driverRating ?? item.driverMeanRating ?? 0,
                  avatar,
                  statusLabel: stateBadge ?? undefined,
                  statusColor,
                };

                return (
                  <View key={item.bookingId ?? item.id} style={myRidesInline.tripCardWrapper}>
                    <RideCard
                      ride={ride}
                      mode="my-rides"
                      onPress={() => {
                        // Format memberSince from whichever date field is available
                        const rawCreated = item.driverCreatedAt ?? item.driverMemberSince ?? null;
                        const memberSince = rawCreated
                          ? (() => {
                              const d = new Date(rawCreated);
                              return isNaN(d.getTime())
                                ? rawCreated
                                : new Intl.DateTimeFormat('es-CR', { month: 'long', year: 'numeric' }).format(d);
                            })()
                          : '';

                        router.push({
                          pathname: '/ride-detail',
                          params: {
                            id: tripId,
                            historyMode: '1',
                            bookingId:       item.bookingId    ?? '',
                            bookingState:    item.bookingState ?? '',
                            driverId:        item.driverId     ?? '',
                            tripState:       (item.tripState ?? item.state ?? '').toLowerCase(),
                            driverName:      `${item.driverFirstName ?? ''} ${item.driverLastName ?? ''}`.trim()
                                              || item.driverName || '',
                            isDriverView:    tab === 'driver' ? '1' : '0',
                            // Driver stats for the detail card
                            driverRating:    String(item.driverRating ?? item.driverMeanRating ?? 0),
                            driverTrips:     String(item.driverTrips  ?? item.driverTotalTrips ?? 0),
                            driverMemberSince: memberSince,
                          },
                        });
                      }}
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
