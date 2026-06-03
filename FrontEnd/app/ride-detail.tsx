// Ride detail screen — shown when the user taps a ride card in the search results.
// Displays a Google Static Maps preview of the route, full trip details, driver profile
// with ratings, recent reviews, and a fixed booking panel at the bottom.
// Uses mock data from constants/mock-rides.ts until the backend API is ready.

import { useLoading } from "@/contexts/loading";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from '@/contexts/auth';
import { bookingsApi } from '@/services/api';
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Appearance,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import InteractiveMapModal from "../components/map-modal";

import AnimatedPressable from "@/components/animated-pressable";
import GlassCard from "@/components/glass-card";
import { Brand, Fonts } from "@/constants/theme";
import { useTripsData } from "@/hooks/use-trips-data";
import { useAppTheme } from "@/hooks/use-app-theme";
import { makeStyles, staticStyles as rideDetailStaticStyles } from "../styles/app/ride-detail.styles";

const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? "";
const BOOKING_PANEL_HEIGHT = 112;

// Fetches the road route polyline from Directions API.
// Returns the encoded polyline string, or null if unavailable (web / no key / API error).
async function fetchRoutePolyline(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): Promise<string | null> {
  // Directions REST API is blocked by CORS from the browser (same restriction as Places Autocomplete).
  // On web the static map falls back to a straight line between the two points.
  if (!GOOGLE_MAPS_KEY || typeof document !== "undefined") return null;
  try {
    const params = new URLSearchParams({
      origin: `${fromLat},${fromLng}`,
      destination: `${toLat},${toLng}`,
      key: GOOGLE_MAPS_KEY,
    });
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?${params}`,
    );
    const json = await res.json();
    if (json.status !== "OK" || !json.routes?.[0]) return null;
    return json.routes[0].overview_polyline.points as string;
  } catch (e) {
    console.warn("[Directions] fetch error", e);
    return null;
  }
}

// Map style rules — each entry becomes a &style= parameter in the Static Maps URL.
// Dark theme mirrors the app's dark surface (#1a1a1a) with teal water and muted labels.
// Light theme keeps roads clean and tints water with the app's brand green (#bae2dd).
const DARK_MAP_STYLES = [
  "feature:all|element:geometry|color:0x060e0d",
  "feature:all|element:labels.text.fill|color:0x4a7a74",
  "feature:all|element:labels.text.stroke|color:0x060e0d",
  "feature:road|element:geometry|color:0x0f1f1d",
  "feature:road.highway|element:geometry|color:0x162624",
  "feature:road.highway|element:geometry.stroke|color:0x1a9e8f",
  "feature:water|element:geometry|color:0x040a09",
  "feature:landscape.natural|element:geometry|color:0x060c0b",
  "feature:landscape.man_made|element:geometry|color:0x0a1916",
  "feature:poi|element:geometry|color:0x060e0d",
  "feature:poi.park|element:geometry|color:0x07110a",
  "feature:transit|element:geometry|color:0x0d1b19",
  "feature:administrative|element:labels.text.fill|color:0x2e5550",
];

const LIGHT_MAP_STYLES = [
  "feature:water|element:geometry|color:0xbae2dd",
  "feature:landscape.natural|element:geometry|color:0xf0f7f5",
  "feature:poi.park|element:geometry|color:0xdceee9",
  "feature:road|element:geometry|color:0xffffff",
  "feature:road.highway|element:geometry|color:0xe8f4f1",
  "feature:road.highway|element:geometry.stroke|color:0x1a9e8f",
  "feature:administrative|element:labels.text.fill|color:0x595959",
];

function buildMapUrl(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  encodedPolyline: string | null,
  isDark: boolean,
): string | null {
  if (!GOOGLE_MAPS_KEY) return null;
  let url =
    `https://maps.googleapis.com/maps/api/staticmap?size=800x440&scale=2&maptype=roadmap` +
    `&markers=color:0x1a9e8f|size:mid|label:A|${fromLat},${fromLng}` +
    `&markers=color:0xE53935|size:mid|label:B|${toLat},${toLng}`;
  if (encodedPolyline) {
    url += `&path=color:0x1a9e8fff|weight:4|enc:${encodedPolyline}`;
  } else {
    url += `&path=color:0x1a9e8fff|weight:4|${fromLat},${fromLng}|${toLat},${toLng}`;
  }
  const styles = isDark ? DARK_MAP_STYLES : LIGHT_MAP_STYLES;
  for (const style of styles) {
    url += `&style=${encodeURIComponent(style)}`;
  }
  return url + `&key=${GOOGLE_MAPS_KEY}`;
}

function StarRating({ rating, size = 13 }: { rating: number; size?: number }) {
  const full = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.4;
  const empty = 5 - full - (hasHalf ? 1 : 0);
  return (
    <View style={rideDetailStaticStyles.starRatingRow}>
      {Array.from({ length: full }).map((_, i) => (
        <Ionicons key={`f${i}`} name="star" size={size} color="#f7a900" />
      ))}
      {hasHalf ? (
        <Ionicons name="star-half" size={size} color="#f7a900" />
      ) : null}
      {Array.from({ length: empty }).map((_, i) => (
        <Ionicons
          key={`e${i}`}
          name="star-outline"
          size={size}
          color="#f7a900"
        />
      ))}
    </View>
  );
}

function dateLabel(date: Date) {
  return date.toLocaleDateString("es-CR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function timeLabel(hour: number, minute: number) {
  const period = hour < 12 ? "AM" : "PM";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:${String(minute).padStart(2, "0")} ${period}`;
}

type RideReview = {
  id: string;
  reviewer: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
};

type RideDetail = {
  id: string;
  from: string;
  to: string;
  fromCoords: { lat: number; lng: number };
  toCoords: { lat: number; lng: number };
  date: string;
  time: string;
  price: number;
  totalSeats: number;
  availableSeats: number;
  notes?: string;
  driver: {
    id: string;
    fullName: string;
    avatar: string;
    rating: number;
    ratingsCount: number;
    tripsCompleted: number;
    memberSince: string;
    vehicle: string;
    plate: string;
    verified: boolean;
    reviews: RideReview[];
  };
};
export default function RideDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isDark, colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { showLoader, hideLoader } = useLoading();
  const { trips, isLoading: tripsLoading, error: tripsError, refreshTrips, updateTripAvailableSeats } = useTripsData();

  useEffect(() => { refreshTrips(); }, [refreshTrips]);
  const tripId = Array.isArray(id) ? id[0] : id;

  const trip = useMemo(
    () => trips?.find((item) => item.id === tripId) ?? null,
    [trips, tripId],
  );

  const ride = useMemo<RideDetail | null>(() => {
    if (!trip) return null;

    const departure = new Date(trip.departureAt);
    const driverNameParts = trip.driverName.split(" ");
    const driverAvatar =
      `${driverNameParts[0]?.[0] ?? ""}${driverNameParts[1]?.[0] ?? ""}`.toUpperCase();

    return {
      id: trip.id,
      from: trip.origin,
      to: trip.destination,
      fromCoords: { lat: trip.originLat, lng: trip.originLng },
      toCoords: { lat: trip.destinationLat, lng: trip.destinationLng },
      date: dateLabel(departure),
      time: timeLabel(departure.getHours(), departure.getMinutes()),
      price: trip.rate,
      totalSeats: trip.totalSeats,
      availableSeats: trip.availableSeats,
      notes: trip.notes,
      driver: {
        id: trip.driverId,
        fullName: trip.driverName,
        avatar: driverAvatar,
        rating: trip.driverRating ?? 0,
        ratingsCount: trip.driverRating ? 1 : 0,
        tripsCompleted: trip.driverTripsCount ?? 0,
        memberSince: trip.driverMemberSince ?? "",
        vehicle: trip.vehicleModel ?? trip.vehicleId,
        plate: trip.vehiclePlate ?? "",
        verified: false,
        reviews: [] as RideReview[],
      },
    };
  }, [trip]);
  
  const [seats, setSeats] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [booked, setBooked] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [polyline, setPolyline] = useState<string | null>(null);
  const [mapModalVisible, setMapModalVisible] = useState(false);

  useEffect(() => {
    if (!ride) return;
    const { fromCoords: f, toCoords: t } = ride;
    if (!f || !t) return;
    showLoader("Cargando ruta...");
    fetchRoutePolyline(f.lat, f.lng, t.lat, t.lng)
      .then((poly) => {
        setPolyline(poly);
        hideLoader();
      })
      .catch(() => hideLoader());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ride]);

  // Rebuild map URL synchronously whenever polyline or theme changes.
  // Appearance.getColorScheme() reads the CURRENT system value directly, avoiding
  // the closure-capture problem that can occur when isDark is still null on first render.
  useEffect(() => {
    if (!ride) return;
    const { fromCoords: f, toCoords: t } = ride;
    if (!f || !t) return setMapUrl(null);
    const dark = Appearance.getColorScheme() === "dark";
    setMapError(false);
    setMapUrl(buildMapUrl(f.lat, f.lng, t.lat, t.lng, polyline, dark));
  }, [ride, polyline, isDark]);

  const totalPrice = seats * (ride?.price ?? 0);
  const { token, user } = useAuth();
  const [, setExistingBookingId] = useState<string | null>(null);

  // Check whether the authenticated user already has a booking for this trip
  useEffect(() => {
    let mounted = true;
    if (!token || !user || !ride) return;
    // If the current user is the driver of this trip, skip booking checks
    if (user.id === ride.driver.id) return;

    (async () => {
      try {
        const list = await bookingsApi.getAll(token);
        if (!mounted || !Array.isArray(list)) return;
        const match = list.find((b: any) => b.tripId === ride.id && b.passengerId === user.id);
        if (match) {
          setBooked(true);
          setExistingBookingId(String(match.id));
          // reflect reserved seats in UI
          if (typeof match.seatsReserved === 'number' && match.seatsReserved > 0) {
            setSeats(match.seatsReserved);
          }
        }
      } catch (err) {
        // Best-effort booking check: log the error for diagnostics but do not
        // surface a blocking UI alert since this is non-critical.
        console.warn("[Bookings] failed to check existing bookings", err);
      }
    })();

    return () => { mounted = false; };
  }, [token, user, ride]);

  if (!tripId) {
    return (
      <View
        style={[
          styles.container,
          styles.errorContainer,
          { paddingTop: insets.top },
        ]}
      >
        <Ionicons
          name="alert-circle-outline"
          size={48}
          color={colors.textMuted}
        />
        <Text style={styles.errorText}>Viaje no encontrado</Text>
        <Pressable style={styles.errorBackBtn} onPress={() => router.back()}>
          <Text style={styles.errorBackBtnText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  if (!ride) {
    return (
      <View
        style={[
          styles.container,
          styles.errorContainer,
          { paddingTop: insets.top },
        ]}
      >
        <Ionicons name="time-outline" size={48} color={colors.textMuted} />
        <Text style={styles.errorText}>
          {tripsError ??
            (tripsLoading ? "Cargando viaje..." : "Viaje no encontrado")}
        </Text>
      </View>
    );
  }

  // Booking handler — called when the user taps the "Reservar" button in the booking panel.
  const handleReserve = async () => {
    if (!ride) return;
    if (!token) {
      Alert.alert("Inicia sesión", "Debes iniciar sesión para reservar un viaje.");
      return;
    }

    // Prevent drivers from reserving seats on their own trips
    if (user?.id === trip?.driverId) {
      Alert.alert('No permitido', 'No puedes reservar un espacio en tu propio viaje.');
      return;
    }

    setBookingLoading(true);
    showLoader("Reservando viaje...");
    try {
      const estimatedAmount = totalPrice;
      const res = await bookingsApi.create(ride.id, seats, estimatedAmount, token);
      // Optimistically update UI
      setBooked(true);
      if (res && res.id) setExistingBookingId(String(res.id));
      // Optimistic local update of available seats for immediate UX
      updateTripAvailableSeats?.(ride.id, -seats);
      // Refresh trips in background to ensure server consistency
      refreshTrips?.();
      Alert.alert(
        "¡Viaje reservado!",
        `Has reservado ${seats} ${seats === 1 ? "espacio" : "espacios"} en este viaje.`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error reservando el viaje';
      Alert.alert('Error', msg);
    } finally {
      hideLoader();
      setBookingLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {ride.from} → {ride.to}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: BOOKING_PANEL_HEIGHT + insets.bottom + 8,
        }}
      >
        {/* Map — tap to open full-screen zoomable view */}
        <Pressable
          style={styles.mapContainer}
          onPress={() => setMapModalVisible(true)}
        >
          {mapUrl && !mapError ? (
            <Image
              source={{ uri: mapUrl }}
              style={styles.mapImage}
              resizeMode="cover"
              onError={() => setMapError(true)}
            />
          ) : (
            <View style={styles.mapFallback}>
              <Ionicons name="map-outline" size={40} color={colors.textMuted} />
              <Text style={styles.mapFallbackText}>
                {ride.from} → {ride.to}
              </Text>
            </View>
          )}
          <View style={styles.mapExpandBtn}>
            <Ionicons name="expand-outline" size={16} color="#ffffff" />
          </View>
          <View style={styles.mapBadgesRow}>
            <View style={styles.mapBadge}>
              <View style={styles.mapDot} />
              <Text style={styles.mapBadgeText} numberOfLines={1}>
                {ride.from}
              </Text>
            </View>
            <View style={styles.mapBadge}>
              <Ionicons name="location" size={11} color="#E53935" />
              <Text style={styles.mapBadgeText} numberOfLines={1}>
                {ride.to}
              </Text>
            </View>
          </View>
        </Pressable>

        {/* Content surface */}
        <View style={styles.surface}>
          {/* Trip info card */}
          <Animated.View entering={FadeInDown.duration(240).delay(60)}>
            <GlassCard style={styles.card} intensity={34}>
              {/* Route */}
              <View style={styles.routeRow}>
                <View style={styles.routeLine}>
                  <View style={styles.routeDot} />
                  <View style={styles.routeConnector} />
                  <Ionicons
                    name="location"
                    size={14}
                    color={Brand.colors.green.normal}
                  />
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

              {/* 2×2 detail grid */}
              <View style={styles.detailGrid}>
                <View style={styles.detailCell}>
                  <Ionicons
                    style={styles.detailIcon}
                    name="calendar-outline"
                    size={16}
                    color={Brand.colors.green.dark}
                  />
                  <Text style={styles.detailLabel}>Fecha</Text>
                  <Text style={styles.detailValue}>{ride.date}</Text>
                </View>
                <View style={[styles.detailCell, styles.detailCellRight]}>
                  <Ionicons
                    style={styles.detailIcon}
                    name="time-outline"
                    size={16}
                    color={Brand.colors.green.dark}
                  />
                  <Text style={styles.detailLabel}>Hora</Text>
                  <Text style={styles.detailValue}>{ride.time}</Text>
                </View>
                <View style={[styles.detailCell, styles.detailCellBottom]}>
                  <Ionicons
                    style={styles.detailIcon}
                    name="people-outline"
                    size={16}
                    color={Brand.colors.green.dark}
                  />
                  <Text style={styles.detailLabel}>Espacios libres</Text>
                  <Text style={styles.detailValue}>
                    {ride.availableSeats}{" "}
                    <Text
                      style={{
                        color: colors.textMuted,
                        fontSize: 13,
                        fontFamily: Fonts.sans,
                      }}
                    >
                      de {ride.totalSeats}
                    </Text>
                  </Text>
                </View>
                <View
                  style={[
                    styles.detailCell,
                    styles.detailCellRight,
                    styles.detailCellBottom,
                  ]}
                >
                  <Ionicons
                    style={styles.detailIcon}
                    name="cash-outline"
                    size={16}
                    color={Brand.colors.green.dark}
                  />
                  <Text style={styles.detailLabel}>Por persona</Text>
                  <Text style={[styles.detailValue, styles.detailValueGreen]}>
                    ₡{ride.price.toLocaleString()}
                  </Text>
                </View>
              </View>

              {ride.notes ? (
                <>
                  <View style={styles.divider} />
                  <View style={styles.notesRow}>
                    <Ionicons
                      name="information-circle-outline"
                      size={16}
                      color={colors.textMuted}
                    />
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
                  <Text style={styles.driverAvatarText}>
                    {ride.driver.avatar}
                  </Text>
                </View>
                <View style={styles.driverInfo}>
                  <View style={styles.driverNameRow}>
                    <Text style={styles.driverName}>
                      {ride.driver.fullName}
                    </Text>
                    {ride.driver.verified && (
                      <View style={styles.verifiedBadge}>
                        <Ionicons
                          name="checkmark-circle"
                          size={12}
                          color={Brand.colors.green.normal}
                        />
                        <Text style={styles.verifiedText}>Verificado</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.driverRatingRow}>
                    <StarRating rating={ride.driver.rating} size={13} />
                    <Text style={styles.driverRatingText}>
                      {ride.driver.rating} ({ride.driver.ratingsCount})
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.statsRow}>
                <View style={styles.statCell}>
                  <Text style={styles.statValue}>
                    {ride.driver.tripsCompleted}
                  </Text>
                  <Text style={styles.statLabel}>Viajes</Text>
                </View>
                <View style={[styles.statCell, styles.statCellDivider]}>
                  <Text style={styles.statValue}>
                    {ride.driver.memberSince}
                  </Text>
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
                      {ride.driver.vehicle || "Vehículo sin modelo"}
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

          {/* Reviews */}
          <Animated.View
            entering={FadeInDown.duration(240).delay(200)}
            style={styles.reviewsSection}
          >
            <Text style={styles.sectionTitle}>Reseñas recientes</Text>
            {ride.driver.reviews.map((review) => (
              <GlassCard
                key={review.id}
                style={styles.reviewCard}
                intensity={28}
              >
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewAvatar}>
                    <Text style={styles.reviewAvatarText}>{review.avatar}</Text>
                  </View>
                  <View style={styles.reviewMeta}>
                    <Text style={styles.reviewerName}>{review.reviewer}</Text>
                    <View style={styles.reviewRatingRow}>
                      <StarRating rating={review.rating} size={11} />
                      <Text style={styles.reviewDate}>{review.date}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </GlassCard>
            ))}
          </Animated.View>
        </View>
      </ScrollView>

      {/* Fixed booking panel - hidden when the current user is the trip driver */}
      {user?.id !== trip?.driverId && (
        <View style={[styles.bookingPanel, { paddingBottom: insets.bottom + 14 }]}> 
          <View style={styles.bookingRow}>
            <View style={styles.bookingGroup}>
              <Text style={styles.bookingLabel}>Espacios</Text>
              <View style={styles.seatCounter}>
                <Pressable
                  style={[styles.seatBtn, (seats <= 1 || booked) && styles.seatBtnDisabled]}
                  onPress={() => setSeats((s) => Math.max(1, s - 1))}
                  disabled={seats <= 1 || booked}
                >
                  <Ionicons
                    name="remove"
                    size={16}
                    color={seats <= 1 || booked ? colors.textMuted : Brand.colors.black.b1}
                  />
                </Pressable>
                <Text style={[styles.seatNumber, booked && { color: colors.textMuted }]}>{seats}</Text>
                <Pressable
                  style={[
                    styles.seatBtn,
                    (seats >= ride.availableSeats || booked) && styles.seatBtnDisabled,
                  ]}
                  onPress={() =>
                    setSeats((s) => Math.min(ride.availableSeats, s + 1))
                  }
                  disabled={seats >= ride.availableSeats || booked}
                >
                  <Ionicons
                    name="add"
                    size={16}
                    color={
                      seats >= ride.availableSeats || booked
                        ? colors.textMuted
                        : Brand.colors.black.b1
                    }
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.bookingGroup}>
              <Text style={styles.bookingLabel}>Total</Text>
              <Text style={styles.totalPrice}>
                ₡{totalPrice.toLocaleString()}
              </Text>
            </View>
          </View>

          <AnimatedPressable
            pressedScale={0.98}
            style={[styles.reserveBtn, (bookingLoading || booked) && { opacity: 0.7 }]}
            onPress={handleReserve}
            disabled={bookingLoading || booked}
          >
            <Text style={[styles.reserveBtnText, (bookingLoading || booked) && { color: colors.textMuted }]}>{booked ? 'Espacio reservado' : (bookingLoading ? 'Reservando...' : 'Reservar espacio')}</Text>
          </AnimatedPressable>
        </View>
      )}

      <InteractiveMapModal
        visible={mapModalVisible}
        onClose={() => setMapModalVisible(false)}
        ride={ride}
        polyline={polyline}
      />
    </View>
  );
}
