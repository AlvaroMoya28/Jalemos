// Ride detail screen — shown when the user taps a ride card in the search results.
// Displays a Google Static Maps preview of the route, full trip details, driver profile
// with ratings, recent reviews, and a fixed booking panel at the bottom.
// Uses mock data from constants/mock-rides.ts until the backend API is ready.

import { useLoading } from "@/contexts/loading";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Appearance,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import InteractiveMapModal from "../components/map-modal";

import AnimatedPressable from "@/components/animated-pressable";
import GlassCard from "@/components/glass-card";
import { Brand, Fonts, withElevation } from "@/constants/theme";
import { useTrips } from "@/contexts/trips";
import { useAppTheme } from "@/hooks/use-app-theme";

const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? "";
const MAP_HEIGHT = 220;
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
    <View style={{ flexDirection: "row", gap: 1 }}>
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

function makeStyles(c: ReturnType<typeof useAppTheme>["colors"]) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.screenBg,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Brand.grid.margin,
      paddingVertical: 12,
      backgroundColor: c.screenBg,
    },
    backBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: c.surface,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: c.border,
      ...withElevation(100),
    },
    headerTitle: {
      flex: 1,
      textAlign: "center",
      color: c.textPrimary,
      fontFamily: Fonts.headingBold,
      fontSize: 16,
      marginHorizontal: 8,
    },
    headerSpacer: {
      width: 38,
    },
    // Map
    mapContainer: {
      height: MAP_HEIGHT,
      backgroundColor: c.surfaceAlt,
      overflow: "hidden",
    },
    mapImage: {
      width: "100%",
      height: MAP_HEIGHT,
    },
    mapFallback: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    mapFallbackText: {
      fontFamily: Fonts.heading,
      fontSize: 14,
      color: c.textMuted,
    },
    mapExpandBtn: {
      position: "absolute",
      top: 10,
      right: 10,
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: "rgba(0,0,0,0.52)",
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.25)",
    },
    mapBadgesRow: {
      position: "absolute",
      bottom: 32,
      left: 12,
      right: 12,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    mapBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: "rgba(0,0,0,0.58)",
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
      maxWidth: "46%",
    },
    mapDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: Brand.colors.green.normal,
      flexShrink: 0,
    },
    mapBadgeText: {
      color: "#ffffff",
      fontFamily: Fonts.heading,
      fontSize: 12,
    },
    // Surface
    surface: {
      backgroundColor: c.bottomSurface,
      borderTopLeftRadius: Brand.radius[24],
      borderTopRightRadius: Brand.radius[24],
      marginTop: -20,
      paddingTop: 20,
      paddingHorizontal: Brand.grid.margin,
      paddingBottom: 12,
      gap: 12,
    },
    card: {
      borderRadius: Brand.radius[16],
      padding: Brand.spacing[16],
    },
    // Route inside trip card
    routeRow: {
      flexDirection: "row",
      gap: 12,
      alignItems: "stretch",
    },
    routeLine: {
      alignItems: "center",
      paddingTop: 3,
      gap: 0,
    },
    routeDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: Brand.colors.green.normal,
    },
    routeConnector: {
      width: 2,
      flex: 1,
      backgroundColor: c.border,
      marginVertical: 4,
      minHeight: 20,
    },
    routePlaces: {
      flex: 1,
      gap: 8,
      paddingBottom: 2,
    },
    routePlaceBlock: {
      gap: 1,
    },
    routeLabel: {
      fontSize: 10,
      color: c.textMuted,
      fontFamily: Fonts.sans,
      textTransform: "uppercase",
    },
    routePlace: {
      fontSize: 15,
      color: c.textPrimary,
      fontFamily: Fonts.headingBold,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.border,
      marginVertical: 12,
    },
    // Detail grid 2×2
    detailGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
    },
    detailCell: {
      width: "50%",
      alignItems: "flex-start",
      gap: 4,
      paddingVertical: 10,
      paddingHorizontal: 4,
    },
    detailCellRight: {
      paddingLeft: 16,
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: c.border,
    },
    detailCellBottom: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    detailLabel: {
      fontSize: 11,
      color: c.textMuted,
      fontFamily: Fonts.sans,
      textTransform: "uppercase",
    },
    detailValue: {
      fontSize: 15,
      color: c.textPrimary,
      fontFamily: Fonts.headingBold,
    },
    detailValueGreen: {
      color: Brand.colors.green.normal,
    },
    detailIcon: {
      marginBottom: 2,
    },
    notesRow: {
      flexDirection: "row",
      gap: 8,
      alignItems: "flex-start",
    },
    notesText: {
      flex: 1,
      fontSize: 12,
      color: c.textSecondary,
      fontFamily: Fonts.sans,
      lineHeight: 18,
    },
    // Driver card
    driverHeader: {
      flexDirection: "row",
      gap: 12,
      alignItems: "center",
    },
    driverAvatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: Brand.colors.green.light,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    driverAvatarText: {
      fontSize: 18,
      color: Brand.colors.green.darker,
      fontFamily: Fonts.headingBold,
    },
    driverInfo: {
      flex: 1,
      gap: 4,
    },
    driverNameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flexWrap: "wrap",
    },
    driverName: {
      fontSize: 16,
      color: c.textPrimary,
      fontFamily: Fonts.headingBold,
    },
    verifiedBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      backgroundColor: Brand.colors.green.normal + "1a",
      borderRadius: 999,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderWidth: 1,
      borderColor: Brand.colors.green.normal + "44",
    },
    verifiedText: {
      fontSize: 10,
      color: Brand.colors.green.dark,
      fontFamily: Fonts.heading,
    },
    driverRatingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    driverRatingText: {
      fontSize: 12,
      color: c.textSecondary,
      fontFamily: Fonts.sans,
    },
    // Driver stats row
    statsRow: {
      flexDirection: "row",
    },
    statCell: {
      flex: 1,
      alignItems: "center",
      gap: 3,
      paddingVertical: 6,
    },
    statCellDivider: {
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: c.border,
    },
    statValue: {
      fontSize: 14,
      color: c.textPrimary,
      fontFamily: Fonts.headingBold,
      textAlign: "center",
    },
    statLabel: {
      fontSize: 10,
      color: c.textMuted,
      fontFamily: Fonts.sans,
      textTransform: "uppercase",
      textAlign: "center",
    },
    // Reviews
    reviewsSection: {
      gap: 8,
    },
    sectionTitle: {
      fontSize: 15,
      color: c.textPrimary,
      fontFamily: Fonts.headingBold,
      marginBottom: 2,
    },
    reviewCard: {
      borderRadius: Brand.radius[12],
      padding: 12,
      gap: 8,
    },
    reviewHeader: {
      flexDirection: "row",
      gap: 10,
      alignItems: "center",
    },
    reviewAvatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: c.surfaceAlt,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: c.border,
      flexShrink: 0,
    },
    reviewAvatarText: {
      fontSize: 12,
      color: c.textSecondary,
      fontFamily: Fonts.headingBold,
    },
    reviewMeta: {
      flex: 1,
      gap: 3,
    },
    reviewerName: {
      fontSize: 13,
      color: c.textPrimary,
      fontFamily: Fonts.heading,
    },
    reviewRatingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    reviewDate: {
      fontSize: 11,
      color: c.textMuted,
      fontFamily: Fonts.sans,
    },
    reviewComment: {
      fontSize: 13,
      color: c.textSecondary,
      fontFamily: Fonts.sans,
      lineHeight: 19,
    },
    // Booking panel
    bookingPanel: {
      backgroundColor: c.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      paddingHorizontal: Brand.grid.margin,
      paddingTop: 14,
      ...withElevation(400),
    },
    bookingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 12,
    },
    bookingGroup: {
      flex: 1,
      gap: 3,
    },
    bookingLabel: {
      fontSize: 11,
      color: c.textMuted,
      fontFamily: Fonts.sans,
      textTransform: "uppercase",
    },
    seatCounter: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    seatBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: Brand.colors.green.normal,
      alignItems: "center",
      justifyContent: "center",
    },
    seatBtnDisabled: {
      backgroundColor: c.surfaceAlt,
      borderWidth: 1,
      borderColor: c.border,
    },
    seatNumber: {
      fontSize: 18,
      color: c.textPrimary,
      fontFamily: Fonts.headingBold,
      minWidth: 24,
      textAlign: "center",
    },
    totalPrice: {
      fontSize: 22,
      color: Brand.colors.green.normal,
      fontFamily: Fonts.headingHeavy,
    },
    reserveBtn: {
      backgroundColor: Brand.colors.green.normal,
      borderRadius: 999,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
    },
    reserveBtnText: {
      color: Brand.colors.black.b1,
      fontFamily: Fonts.headingBold,
      fontSize: 15,
    },
    // Error state
    errorContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 14,
    },
    errorText: {
      fontSize: 16,
      color: c.textSecondary,
      fontFamily: Fonts.heading,
    },
    errorBackBtn: {
      backgroundColor: Brand.colors.green.normal,
      borderRadius: 999,
      paddingHorizontal: 24,
      paddingVertical: 12,
    },
    errorBackBtnText: {
      color: Brand.colors.black.b1,
      fontFamily: Fonts.headingBold,
      fontSize: 14,
    },
  });
}

export default function RideDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isDark, colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { showLoader, hideLoader } = useLoading();
  const { trips, isLoading: tripsLoading, error: tripsError } = useTrips();
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
        vehicle: trip.vehicleId,
        plate: "",
        verified: false,
        reviews: [] as RideReview[],
      },
    };
  }, [trip]);

  const [seats, setSeats] = useState(1);
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

  const handleReserve = () => {
    showLoader("Reservando viaje...");
    setTimeout(() => {
      hideLoader();
      Alert.alert(
        "¡Viaje reservado!",
        `Has reservado ${seats} ${seats === 1 ? "espacio" : "espacios"} en este viaje.`,
      );
    }, 700);
  };

  if (!ride) {
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
                <View style={[styles.statCell, styles.statCellDivider]}>
                  <Text style={styles.statValue} numberOfLines={1}>
                    {ride.driver.vehicle}
                  </Text>
                  <Text style={styles.statLabel}>{ride.driver.plate}</Text>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

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

      {/* Fixed booking panel */}
      <View
        style={[styles.bookingPanel, { paddingBottom: insets.bottom + 14 }]}
      >
        <View style={styles.bookingRow}>
          <View style={styles.bookingGroup}>
            <Text style={styles.bookingLabel}>Espacios</Text>
            <View style={styles.seatCounter}>
              <Pressable
                style={[styles.seatBtn, seats <= 1 && styles.seatBtnDisabled]}
                onPress={() => setSeats((s) => Math.max(1, s - 1))}
                disabled={seats <= 1}
              >
                <Ionicons
                  name="remove"
                  size={16}
                  color={seats <= 1 ? colors.textMuted : Brand.colors.black.b1}
                />
              </Pressable>
              <Text style={styles.seatNumber}>{seats}</Text>
              <Pressable
                style={[
                  styles.seatBtn,
                  seats >= ride.availableSeats && styles.seatBtnDisabled,
                ]}
                onPress={() =>
                  setSeats((s) => Math.min(ride.availableSeats, s + 1))
                }
                disabled={seats >= ride.availableSeats}
              >
                <Ionicons
                  name="add"
                  size={16}
                  color={
                    seats >= ride.availableSeats
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
          style={styles.reserveBtn}
          onPress={handleReserve}
        >
          <Text style={styles.reserveBtnText}>Reservar viaje</Text>
        </AnimatedPressable>
      </View>

      <InteractiveMapModal
        visible={mapModalVisible}
        onClose={() => setMapModalVisible(false)}
        ride={ride}
        polyline={polyline}
      />
    </View>
  );
}
