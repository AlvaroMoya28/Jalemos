// Ride detail screen — shown when the user taps a ride card in the search results.
// Displays a Google Static Maps preview of the route, full trip details, driver profile
// with ratings, recent reviews, and a fixed booking panel at the bottom.
// Updated by Claude Sonnet 4.6: history mode (direct trip fetch), real driver reviews,
// one-time rating prompt, and driver trip cancellation.
// Uses mock data from constants/mock-rides.ts until the backend API is ready.

import { useLoading } from "@/contexts/loading";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuth } from '@/contexts/auth';
import { bookingsApi, ratingsApi, tripLifecycleApi, get, RatingDTO } from '@/services/api';
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import InteractiveMapModal from "../components/ride-detail/map-modal";

import BookingPanel from "@/components/ride-detail/booking-panel";
import DriverReviews from "@/components/ride-detail/driver-reviews";
import HistoryActions from "@/components/ride-detail/history-actions";
import TripInfoCards from "@/components/ride-detail/trip-info-cards";
import { RideDetail, RideReview } from "@/components/ride-detail/types";
import { dateLabel, timeLabel } from "@/utils/datetime";
import { buildMapUrl, fetchRoutePolyline } from "@/utils/ride-map";
import EmergencyReportModal from "@/components/shared/emergency-report-modal";
import GlassAlert from "@/components/shared/glass-alert";
import RatingModal from "@/components/shared/rating-modal";
import CancellationModal from "@/components/shared/cancellation-modal";
import { useTripsData } from "@/hooks/use-trips-data";
import { useAppTheme } from "@/hooks/use-app-theme";
import { makeStyles } from "../styles/app/ride-detail.styles";

const BOOKING_PANEL_HEIGHT = 112;

export default function RideDetailScreen() {
  const params = useLocalSearchParams<{
    id: string;
    historyMode?: string;
    bookingId?: string;
    bookingState?: string;
    driverId?: string;
    tripState?: string;
    driverName?: string;
    isDriverView?: string;
    driverRating?: string;
    driverTrips?: string;
    driverMemberSince?: string;
  }>();
  const { id, historyMode, bookingId, bookingState, driverId: paramDriverId,
          tripState: paramTripState, driverName: paramDriverName, isDriverView,
          driverRating: paramDriverRating, driverTrips: paramDriverTrips,
          driverMemberSince: paramDriverMemberSince } = params;
  const isHistory   = historyMode === '1';
  const isDriverOwn = isDriverView === '1';

  const router = useRouter();
  const { isDark, colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { showLoader, hideLoader } = useLoading();
  const { trips, isLoading: tripsLoading, error: tripsError, refreshTrips, updateTripAvailableSeats } = useTripsData();

  useEffect(() => { if (!isHistory) refreshTrips(); }, [refreshTrips, isHistory]);
  const tripId = Array.isArray(id) ? id[0] : id;

  // ── History mode: fetch trip directly (any state) ──────────────────────────
  const [historyTrip, setHistoryTrip] = useState<any | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const { token, user } = useAuth();

  useEffect(() => {
    if (!isHistory || !tripId) return;
    setHistoryLoading(true);
    get<any>(`/api/trips/${tripId}`, token ?? undefined)
      .then(data => setHistoryTrip(data))
      .catch(() => setHistoryTrip(null))
      .finally(() => setHistoryLoading(false));
  }, [isHistory, tripId, token]);

  // ── Rating state ───────────────────────────────────────────────────────────
  const [alreadyRated, setAlreadyRated] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingSuccess, setRatingSuccess] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);
  // Driver cancellation (scheduled trips in history)
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  // Passenger booking cancellation
  const [showPassengerCancelModal, setShowPassengerCancelModal] = useState(false);
  const [passengerCancelSubmitting, setPassengerCancelSubmitting] = useState(false);
  const [passengerCancelSuccess, setPassengerCancelSuccess] = useState(false);
  const [passengerCancelError, setPassengerCancelError] = useState<string | null>(null);
  // Reviews received by the driver
  const [driverReviews, setDriverReviews] = useState<RatingDTO[]>([]);
  // Post-trip driver report
  const [showDriverReport, setShowDriverReport] = useState(false);
  const [driverReportSent, setDriverReportSent] = useState(false);

  const canRate = isHistory &&
    !isDriverOwn &&
    !!bookingId &&
    (bookingState === 'completed' || bookingState === 'boarded') &&
    (paramTripState === 'completed' || paramTripState === 'cancelled') &&
    !!paramDriverId;

  useEffect(() => {
    if (!canRate || !paramDriverId || !user) return;
    ratingsApi.getByUser(paramDriverId)
      .then(ratings => {
        setAlreadyRated(ratings.some(r => r.tripId === tripId && r.raterId === user.id));
      })
      .catch(() => {});
  }, [canRate, paramDriverId, tripId, user]);

  // Passenger can report the driver after a completed trip
  const canReportDriver = isHistory &&
    !isDriverOwn &&
    !!paramDriverId &&
    (paramTripState === 'completed') &&
    (bookingState === 'completed' || bookingState === 'boarded');

  const canCancelBooking = isHistory &&
    !isDriverOwn &&
    !!bookingId &&
    (bookingState === 'pending' || bookingState === 'confirmed') &&
    (paramTripState === 'scheduled' || paramTripState === 'boarding');

  const handleCancelBooking = async (reason: string, details: string | null) => {
    if (!token || !bookingId) return;
    setPassengerCancelSubmitting(true);
    try {
      await bookingsApi.cancel(bookingId, reason, details, token);
      setShowPassengerCancelModal(false);
      setPassengerCancelSuccess(true);
    } catch (e: any) {
      setShowPassengerCancelModal(false);
      setPassengerCancelError(e.message ?? 'No se pudo cancelar la reserva.');
    } finally {
      setPassengerCancelSubmitting(false);
    }
  };

  const handleCancelTrip = async (reason: string, details: string | null) => {
    if (!token || !tripId) return;
    setCancelSubmitting(true);
    try {
      await tripLifecycleApi.cancelTrip(tripId, reason, details, token);
      setShowCancelModal(false);
      setCancelSuccess(true);
    } catch (e: any) {
      setShowCancelModal(false);
      setCancelError(e.message ?? 'No se pudo cancelar el viaje.');
    } finally {
      setCancelSubmitting(false);
    }
  };

  const handleSubmitRating = async (score: number, comment: string | null) => {
    if (!token || !tripId || !paramDriverId) return;
    try {
      await ratingsApi.submit({ tripId, ratedId: paramDriverId, score, comment: comment ?? undefined }, token);
      setAlreadyRated(true);
      setShowRatingModal(false);
      setRatingSuccess(true);
    } catch (e: any) {
      setRatingError(e.message ?? 'No se pudo enviar la reseña.');
    }
  };

  // ── Build ride from scheduled list (search mode) ───────────────────────────
  const scheduledTrip = useMemo(
    () => (!isHistory ? trips?.find((item) => item.id === tripId) ?? null : null),
    [trips, tripId, isHistory],
  );

  const ride = useMemo<RideDetail | null>(() => {
    // History mode: build from raw Trip entity + params
    if (isHistory) {
      if (!historyTrip && !historyLoading) return null;
      if (!historyTrip) return null;

      const t = historyTrip;
      const departure = new Date(t.departureAt ?? t.departureAt ?? Date.now());
      const dName = paramDriverName || 'Conductor';
      const dParts = dName.split(' ');
      const dAvatar = `${dParts[0]?.[0] ?? ''}${dParts[1]?.[0] ?? ''}`.toUpperCase();

      return {
        id: t.id ?? tripId,
        from: t.origin ?? '',
        to: t.destination ?? '',
        fromCoords: { lat: Number(t.originLatitude ?? 0), lng: Number(t.originLongitude ?? 0) },
        toCoords: { lat: Number(t.destinationLatitude ?? 0), lng: Number(t.destinationLongitude ?? 0) },
        date: dateLabel(departure),
        time: timeLabel(departure.getHours(), departure.getMinutes()),
        price: t.rate ?? 0,
        totalSeats: t.totalSeats ?? 0,
        availableSeats: t.availableSeats ?? 0,
        notes: t.notes,
        driver: {
          id:             paramDriverId ?? t.driverId ?? '',
          fullName:       dName,
          avatar:         dAvatar,
          rating:         parseFloat(paramDriverRating     ?? '0') || 0,
          ratingsCount:   parseInt(paramDriverTrips        ?? '0') || 0,
          tripsCompleted: parseInt(paramDriverTrips        ?? '0') || 0,
          memberSince:    paramDriverMemberSince           ?? '',
          vehicle: '',
          plate: '',
          verified: false,
          reviews: [] as RideReview[],
        },
      };
    }

    // Search mode: build from scheduled trips list
    const trip = scheduledTrip;
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
  }, [isHistory, historyTrip, historyLoading, scheduledTrip, tripId, paramDriverId, paramDriverName]);

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

  // Load the reviews received by the driver (shown in "Reseñas recientes")
  useEffect(() => {
    const dId = ride?.driver.id;
    if (!dId) return;
    ratingsApi.getByUser(dId)
      .then(setDriverReviews)
      .catch(() => setDriverReviews([]));
  }, [ride?.driver.id]);

  const totalPrice = seats * (ride?.price ?? 0);
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
        const match = list.find((b: any) => b.tripId === ride.id && b.passengerId === user.id && b.state !== 'Cancelled');
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
        <Pressable style={styles.errorBackBtn} onPress={() => { showLoader(); router.back(); setTimeout(() => hideLoader(), 300); }}>
          <Text style={styles.errorBackBtnText}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  if (!ride) {
    const loading = isHistory ? historyLoading : tripsLoading;
    const errMsg  = isHistory
      ? (historyLoading ? 'Cargando viaje...' : 'Viaje no encontrado')
      : (tripsError ?? (tripsLoading ? 'Cargando viaje...' : 'Viaje no encontrado'));
    return (
      <View style={[styles.container, styles.errorContainer, { paddingTop: insets.top }]}>
        <Ionicons name={loading ? 'time-outline' : 'alert-circle-outline'} size={48} color={colors.textMuted} />
        <Text style={styles.errorText}>{errMsg}</Text>
        <Pressable style={styles.errorBackBtn} onPress={() => router.back()}>
          <Text style={styles.errorBackBtnText}>Volver</Text>
        </Pressable>
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
    if (user?.id === scheduledTrip?.driverId) {
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
          onPress={() => { showLoader(); router.back(); setTimeout(() => hideLoader(), 300); }}
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
          paddingBottom: isHistory
            ? insets.bottom + 32
            : BOOKING_PANEL_HEIGHT + insets.bottom + 8,
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
          <TripInfoCards ride={ride} styles={styles} colors={colors} />

          {/* Reviews */}
          <DriverReviews reviews={driverReviews} styles={styles} colors={colors} />

          {/* History: state badge + contextual actions */}
          {isHistory && (
            <HistoryActions
              tripState={paramTripState}
              isDriverOwn={isDriverOwn}
              cancelSuccess={cancelSuccess}
              onOpenCancelTrip={() => setShowCancelModal(true)}
              canCancelBooking={canCancelBooking}
              passengerCancelSuccess={passengerCancelSuccess}
              onOpenCancelBooking={() => setShowPassengerCancelModal(true)}
              canRate={canRate}
              alreadyRated={alreadyRated}
              ratingSuccess={ratingSuccess}
              onOpenRating={() => setShowRatingModal(true)}
              canReportDriver={canReportDriver}
              driverReportSent={driverReportSent}
              onOpenReport={() => setShowDriverReport(true)}
              styles={styles}
              colors={colors}
            />
          )}
        </View>
      </ScrollView>

      {/* ── Booking panel (search/scheduled trips only) ───────────────────── */}
      {!isHistory && (
        /* ── Booking panel (scheduled trips) ────────────────────────────── */
        user?.id !== scheduledTrip?.driverId && (
          <BookingPanel
            ride={ride}
            seats={seats}
            setSeats={setSeats}
            booked={booked}
            bookingLoading={bookingLoading}
            totalPrice={totalPrice}
            bottomInset={insets.bottom}
            onReserve={handleReserve}
            styles={styles}
            colors={colors}
          />
        )
      )}

      <InteractiveMapModal
        visible={mapModalVisible}
        onClose={() => setMapModalVisible(false)}
        ride={ride}
        polyline={polyline}
      />

      {/* Rating modal for history trips */}
      <RatingModal
        visible={showRatingModal}
        ratedUser={paramDriverId && paramDriverName ? {
          id:   paramDriverId,
          name: paramDriverName,
          role: 'driver',
        } : null}
        onSubmit={handleSubmitRating}
        onSkip={() => setShowRatingModal(false)}
      />

      <GlassAlert
        visible={!!ratingError}
        icon="alert-circle"
        iconColor="#e53e3e"
        title="Error al calificar"
        body={ratingError ?? ''}
        primaryLabel="Entendido"
        onDismiss={() => setRatingError(null)}
      />

      <CancellationModal
        visible={showCancelModal}
        type="driver"
        title="¿Por qué cancelas el viaje?"
        onConfirm={handleCancelTrip}
        onCancel={() => setShowCancelModal(false)}
        loading={cancelSubmitting}
      />

      <GlassAlert
        visible={!!cancelError}
        icon="alert-circle"
        iconColor="#e53e3e"
        title="Error al cancelar"
        body={cancelError ?? ''}
        primaryLabel="Entendido"
        onDismiss={() => setCancelError(null)}
      />

      <CancellationModal
        visible={showPassengerCancelModal}
        type="passenger"
        title="¿Por qué cancelas tu reserva?"
        onConfirm={handleCancelBooking}
        onCancel={() => setShowPassengerCancelModal(false)}
        loading={passengerCancelSubmitting}
      />

      <GlassAlert
        visible={!!passengerCancelError}
        icon="alert-circle"
        iconColor="#e53e3e"
        title="Error al cancelar reserva"
        body={passengerCancelError ?? ''}
        primaryLabel="Entendido"
        onDismiss={() => setPassengerCancelError(null)}
      />

      {/* Post-trip driver report */}
      {canReportDriver && (
        <EmergencyReportModal
          visible={showDriverReport}
          tripId={tripId}
          defaultType="driver_report"
          lockType
          onSuccess={() => setDriverReportSent(true)}
          onDismiss={() => setShowDriverReport(false)}
        />
      )}
    </View>
  );
}
