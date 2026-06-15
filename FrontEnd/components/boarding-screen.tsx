// Driver boarding management screen — shown in the Offer tab when the driver has an active trip.
// Handles QR scanning, passenger status, no-show marking, journey start, trip completion,
// trip cancellation, and external navigation launch.
// Updated by Claude Sonnet 4.6: PanResponder slide-to-action, in-trip route map, and
// glassmorphism alerts replacing native Alerts.

import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Image,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { styles, passengerRowStyles, slideStyles, mapStyles } from './styles/boarding-screen.styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brand, Fonts } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useActiveTrip } from '@/contexts/active-trip';
import { useAuth } from '@/contexts/auth';
import { PassengerSummary, TripStatusResponse, tripLifecycleApi, ratingsApi, paymentsApi, PaymentDto } from '@/services/api';
import { openInMaps } from '@/utils/open-in-maps';
import QrScanner from './qr-scanner';
import GlassAlert from './glass-alert';
import CancellationModal from './cancellation-modal';
import RatingModal from './rating-modal';

// ── Map helpers (same pattern as ride-detail) ──────────────────────────────
const GOOGLE_MAPS_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_KEY ?? '';

async function fetchRoutePolyline(fLat: number, fLng: number, tLat: number, tLng: number): Promise<string | null> {
  if (!GOOGLE_MAPS_KEY || Platform.OS === 'web') return null;
  try {
    const params = new URLSearchParams({ origin: `${fLat},${fLng}`, destination: `${tLat},${tLng}`, key: GOOGLE_MAPS_KEY });
    const res  = await fetch(`https://maps.googleapis.com/maps/api/directions/json?${params}`);
    const json = await res.json();
    if (json.status !== 'OK' || !json.routes?.[0]) return null;
    return json.routes[0].overview_polyline.points as string;
  } catch { return null; }
}

const DARK_STYLES = [
  'feature:all|element:geometry|color:0x060e0d',
  'feature:all|element:labels.text.fill|color:0x4a7a74',
  'feature:road|element:geometry|color:0x0f1f1d',
  'feature:road.highway|element:geometry.stroke|color:0x1a9e8f',
  'feature:water|element:geometry|color:0x040a09',
];
const LIGHT_STYLES = [
  'feature:water|element:geometry|color:0xbae2dd',
  'feature:road|element:geometry|color:0xffffff',
  'feature:road.highway|element:geometry.stroke|color:0x1a9e8f',
];

function buildMapUrl(fLat: number, fLng: number, tLat: number, tLng: number, poly: string | null, isDark: boolean): string | null {
  if (!GOOGLE_MAPS_KEY) return null;
  let url = `https://maps.googleapis.com/maps/api/staticmap?size=800x440&scale=2&maptype=roadmap`
    + `&markers=color:0x1a9e8f|size:mid|label:A|${fLat},${fLng}`
    + `&markers=color:0xE53935|size:mid|label:B|${tLat},${tLng}`;
  url += poly
    ? `&path=color:0x1a9e8fff|weight:4|enc:${poly}`
    : `&path=color:0x1a9e8fff|weight:4|${fLat},${fLng}|${tLat},${tLng}`;
  for (const s of isDark ? DARK_STYLES : LIGHT_STYLES) url += `&style=${encodeURIComponent(s)}`;
  return url + `&key=${GOOGLE_MAPS_KEY}`;
}

interface Props {
  trip: TripStatusResponse;
  onTripEnded: () => void;
  /** Called right after the trip is completed, so the parent can freeze this screen
   *  mounted while the driver rates each passenger. */
  onTripCompleted?: (trip: TripStatusResponse) => void;
}

export default function BoardingScreen({ trip, onTripEnded, onTripCompleted }: Props) {
  const { colors, isDark } = useAppTheme();
  const { token }          = useAuth();
  const { refresh }        = useActiveTrip();
  const insets             = useSafeAreaInsets();

  const [scannerOpen, setScannerOpen]         = useState(false);
  const [scanFeedback, setScanFeedback]       = useState<{ name: string; boarded: boolean } | null>(null);
  const [scanning, setScanning]               = useState(false);
  const [showCancel, setShowCancel]           = useState(false);
  const [showSeatbelt, setShowSeatbelt]       = useState(false);
  const [showRating, setShowRating]           = useState(false);
  const [currentRatingIdx, setCurrentRatingIdx] = useState(0);
  const [submitting, setSubmitting]           = useState(false);
  const seatbeltShown                         = useRef(false);
  // Glass alert state for native Alert replacements
  const [noShowConfirm, setNoShowConfirm]     = useState<{ bookingId: string; name: string } | null>(null);
  const [errorMsg, setErrorMsg]               = useState<{ title: string; body: string } | null>(null);
  // Map state (shown when in_progress)
  const [mapUrl, setMapUrl]                   = useState<string | null>(null);
  const [mapError, setMapError]               = useState(false);
  const [polyline, setPolyline]               = useState<string | null>(null);

  // Payment confirmation step (after rating flow)
  const [showPayments, setShowPayments]           = useState(false);
  const [pendingPayments, setPendingPayments]     = useState<(PaymentDto & { passengerName: string })[]>([]);
  const [loadingPayments, setLoadingPayments]     = useState(false);
  const [confirmingId, setConfirmingId]           = useState<string | null>(null);

  const boardedPassengers  = trip.passengers.filter(p => p.bookingState === 'boarded');
  const pendingPassengers  = trip.passengers.filter(p => p.bookingState === 'confirmed' || p.bookingState === 'pending');
  const totalActive        = trip.passengers.filter(p => !['cancelled', 'no_show'].includes(p.bookingState));
  const allBoarded         = pendingPassengers.length === 0;

  const isBoarding   = trip.state === 'boarding';
  const isInProgress = trip.state === 'in_progress';

  // Grace period timer
  const [graceLeft, setGraceLeft] = useState(0);
  useEffect(() => {
    if (!isBoarding || !trip.boardingStartedAt) return;
    const deadline = new Date(trip.departureAt).getTime() + 5 * 60_000;
    const tick = () => setGraceLeft(Math.max(0, deadline - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [isBoarding, trip.departureAt, trip.boardingStartedAt]);

  const graceMinSec = graceLeft > 0
    ? `${Math.floor(graceLeft / 60000)}:${String(Math.floor((graceLeft % 60000) / 1000)).padStart(2, '0')}`
    : null;

  // Fetch route polyline when journey starts
  useEffect(() => {
    if (!isInProgress) return;
    const fLat = Number(trip.originLatitude);
    const fLng = Number(trip.originLongitude);
    const tLat = Number(trip.destinationLatitude);
    const tLng = Number(trip.destinationLongitude);
    fetchRoutePolyline(fLat, fLng, tLat, tLng).then(setPolyline);
  }, [isInProgress, trip.destinationLatitude, trip.destinationLongitude, trip.originLatitude, trip.originLongitude, trip.tripId]);

  // Build static map URL whenever polyline or theme changes
  useEffect(() => {
    if (!isInProgress) return;
    const fLat = Number(trip.originLatitude);
    const fLng = Number(trip.originLongitude);
    const tLat = Number(trip.destinationLatitude);
    const tLng = Number(trip.destinationLongitude);
    setMapError(false);
    setMapUrl(buildMapUrl(fLat, fLng, tLat, tLng, polyline, isDark));
  }, [isInProgress, polyline, isDark, trip.tripId, trip.originLatitude, trip.originLongitude, trip.destinationLatitude, trip.destinationLongitude]);

  // QR scan handler
  const handleScan = useCallback(async (qrToken: string) => {
    if (scanning || !token) return;
    setScanning(true);
    setScannerOpen(false);
    try {
      const result = await tripLifecycleApi.scanQr(trip.tripId, qrToken, token);
      setScanFeedback({ name: `${result.firstName} ${result.lastName}`, boarded: !result.alreadyBoarded });
      refresh();
    } catch (e: any) {
      setErrorMsg({ title: 'QR inválido', body: e.message ?? 'No se pudo escanear el QR.' });
    } finally {
      setScanning(false);
    }
  }, [scanning, token, trip.tripId, refresh]);

  // Mark no-show — opens a GlassAlert confirmation
  const handleNoShow = (bookingId: string, name: string) => {
    setNoShowConfirm({ bookingId, name });
  };
  const confirmNoShow = async () => {
    if (!noShowConfirm) return;
    const { bookingId } = noShowConfirm;
    setNoShowConfirm(null);
    try {
      await tripLifecycleApi.markNoShow(bookingId, token!);
      refresh();
    } catch (e: any) {
      setErrorMsg({ title: 'Error', body: e.message ?? 'No se pudo marcar la inasistencia.' });
    }
  };

  // Start journey
  const handleStartJourney = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      await tripLifecycleApi.startJourney(trip.tripId, token);
      await refresh();
      if (!seatbeltShown.current) { seatbeltShown.current = true; setShowSeatbelt(true); }
    } catch (e: any) {
      setErrorMsg({ title: 'No se puede iniciar', body: e.message ?? 'Inténtalo de nuevo.' });
    } finally { setSubmitting(false); }
  };

  // Complete trip
  const handleCompleteTrip = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      await tripLifecycleApi.completeTrip(trip.tripId, token);
      if (boardedPassengers.length > 0) {
        // Freeze this screen mounted in the parent so the rating flow isn't unmounted
        // when the next poll sets driverTrip = null.
        onTripCompleted?.(trip);
        setCurrentRatingIdx(0);
        setShowRating(true);
      } else {
        onTripEnded();
      }
    } catch (e: any) {
      setErrorMsg({ title: 'Error al finalizar', body: e.message ?? 'Inténtalo de nuevo.' });
    } finally { setSubmitting(false); }
  };

  // Cancel trip
  const handleCancelTrip = async (reason: string, details: string | null) => {
    if (!token) return;
    setSubmitting(true);
    try {
      await tripLifecycleApi.cancelTrip(trip.tripId, reason, details, token);
      setShowCancel(false);
      refresh();
      onTripEnded();
    } catch (e: any) {
      setErrorMsg({ title: 'Error al cancelar', body: e.message ?? 'Inténtalo de nuevo.' });
    } finally { setSubmitting(false); }
  };

  // Rating flow for each boarded passenger
  const handleRatingSubmit = async (score: number, comment: string | null) => {
    if (!token) return;
    const p = boardedPassengers[currentRatingIdx];
    try {
      await ratingsApi.submit({ tripId: trip.tripId, ratedId: p.passengerId, score, comment: comment ?? undefined }, token);
    } catch { /* silent */ }
    const next = currentRatingIdx + 1;
    if (next < boardedPassengers.length) {
      setCurrentRatingIdx(next);
    } else {
      setShowRating(false);
      loadPendingPayments();
    }
  };

  const loadPendingPayments = async () => {
    if (!token) { onTripEnded(); return; }
    setLoadingPayments(true);
    setShowPayments(true);
    try {
      // The passenger's app creates the payment when it polls and detects the trip
      // as completed. That poll may take a few seconds after the driver ends the trip,
      // so we retry up to ~12 s before giving up.
      const DEADLINE = Date.now() + 12_000;
      let results: (PaymentDto & { passengerName: string })[] = [];

      do {
        results = [];
        for (const p of boardedPassengers) {
          try {
            const pay = await paymentsApi.getByBooking(p.bookingId, token);
            if (pay.status === 'pending')
              results.push({ ...pay, passengerName: `${p.firstName} ${p.lastName}` });
          } catch { }
        }
        if (results.length > 0 || Date.now() >= DEADLINE) break;
        await new Promise(r => setTimeout(r, 3_000));
      } while (true);

      setPendingPayments(results);
      if (results.length === 0) {
        setShowPayments(false);
        onTripEnded();
      }
    } catch {
      setShowPayments(false);
      onTripEnded();
    } finally {
      setLoadingPayments(false);
    }
  };

  const handleConfirmPayment = async (paymentId: string) => {
    if (!token) return;
    setConfirmingId(paymentId);
    try {
      await paymentsApi.confirmPayment(paymentId, token);
      setPendingPayments(prev => prev.filter(p => p.id !== paymentId));
    } catch (e: any) {
      setErrorMsg({ title: 'Error', body: e.message ?? 'No se pudo confirmar el pago.' });
    } finally {
      setConfirmingId(null);
    }
  };

  const stateColor  = isBoarding ? '#f4a522' : isInProgress ? Brand.colors.green.normal : '#aaa';
  const stateLabel  = isBoarding ? 'Abordaje en curso' : isInProgress ? 'Viaje en curso' : 'Completado';

  return (
    <View style={[styles.container, { backgroundColor: colors.screenBg, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.stateBadge, { backgroundColor: stateColor + '22' }]}>
          <View style={[styles.stateDot, { backgroundColor: stateColor }]} />
          <Text style={[styles.stateText, { color: stateColor }]}>{stateLabel}</Text>
        </View>
        <Pressable
          style={[styles.cancelBtn, { borderColor: colors.border }]}
          onPress={() => setShowCancel(true)}
        >
          <Ionicons name="close-circle-outline" size={16} color="#e53e3e" />
          <Text style={styles.cancelBtnText}>Cancelar</Text>
        </Pressable>
      </View>

      {/* Route text card — boarding only */}
      {isBoarding && (
        <View style={[styles.routeCard, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <View style={styles.routeRow}>
            <Ionicons name="radio-button-on" size={14} color={Brand.colors.green.dark} />
            <Text style={[styles.routeText, { color: colors.textPrimary }]} numberOfLines={1}>{trip.origin}</Text>
          </View>
          <View style={[styles.routeDivider, { backgroundColor: colors.border }]} />
          <View style={styles.routeRow}>
            <Ionicons name="location" size={14} color={Brand.colors.green.normal} />
            <Text style={[styles.routeText, { color: colors.textPrimary }]} numberOfLines={1}>{trip.destination}</Text>
          </View>
        </View>
      )}

      {/* Scan QR button — boarding only */}
      {isBoarding && (
        <Pressable
          style={[styles.scanBtn, { marginHorizontal: 16, marginBottom: 10 }, scanning && { opacity: 0.6 }]}
          onPress={() => setScannerOpen(true)}
          disabled={scanning}
        >
          {scanning
            ? <ActivityIndicator color="#fff" size="small" />
            : <Ionicons name="qr-code-outline" size={20} color="#fff" />
          }
          <Text style={styles.scanBtnText}>{scanning ? 'Procesando…' : 'Escanear QR de pasajero'}</Text>
        </Pressable>
      )}

      {/* Map + navigation — in_progress only */}
      {isInProgress && (
        <>
          <Pressable
            style={mapStyles.container}
            onPress={() => openInMaps(
              Number(trip.originLatitude), Number(trip.originLongitude),
              Number(trip.destinationLatitude), Number(trip.destinationLongitude),
              trip.origin, trip.destination,
            )}
          >
            {mapUrl && !mapError ? (
              <Image
                source={{ uri: mapUrl }}
                style={mapStyles.image}
                resizeMode="cover"
                onError={() => setMapError(true)}
              />
            ) : (
              <View style={[mapStyles.fallback, { backgroundColor: colors.inputBg }]}>
                <Ionicons name="map-outline" size={36} color={colors.textMuted} />
                <Text style={[mapStyles.fallbackText, { color: colors.textMuted }]} numberOfLines={1}>
                  {trip.origin} → {trip.destination}
                </Text>
              </View>
            )}
            <View style={mapStyles.expandIcon}>
              <Ionicons name="navigate" size={14} color="#fff" />
            </View>
          </Pressable>

          <Pressable
            style={[styles.scanBtn, { backgroundColor: '#3182ce', marginHorizontal: 16, marginBottom: 10 }]}
            onPress={() => openInMaps(
              Number(trip.originLatitude), Number(trip.originLongitude),
              Number(trip.destinationLatitude), Number(trip.destinationLongitude),
              trip.origin, trip.destination,
            )}
          >
            <Ionicons name="navigate-outline" size={20} color="#fff" />
            <Text style={styles.scanBtnText}>Abrir en mapa</Text>
          </Pressable>
        </>
      )}

      {/* Passengers */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        Pasajeros — {boardedPassengers.length}/{totalActive.length} abordados
      </Text>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 8, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {trip.passengers.filter(p => p.bookingState !== 'cancelled').length === 0 ? (
          <View style={[styles.graceCard, { backgroundColor: colors.inputBg }]}>
            <Ionicons name="people-outline" size={16} color={colors.textMuted} />
            <Text style={[styles.graceText, { color: colors.textSecondary }]}>
              Sin pasajeros reservados. Escanea su QR cuando suban.
            </Text>
          </View>
        ) : (
          trip.passengers.filter(p => p.bookingState !== 'cancelled').map(p => (
            <PassengerRow
              key={p.bookingId}
              passenger={p}
              isBoarding={isBoarding}
              graceElapsed={graceLeft === 0}
              onMarkNoShow={() => handleNoShow(p.bookingId, `${p.firstName} ${p.lastName}`)}
              colors={colors}
            />
          ))
        )}

        {isBoarding && graceMinSec && pendingPassengers.length > 0 && (
          <View style={[styles.graceCard, { backgroundColor: '#f4a52218' }]}>
            <Ionicons name="timer-outline" size={16} color="#f4a522" />
            <Text style={styles.graceText}>
              Período de gracia: <Text style={{ fontFamily: Fonts.headingBold }}>{graceMinSec}</Text> restante
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Primary action */}
      {isBoarding && (
        <SlideToAction
          label={allBoarded ? 'Iniciar viaje' : `Iniciar viaje (${pendingPassengers.length} pendiente${pendingPassengers.length > 1 ? 's' : ''})`}
          onSlide={allBoarded ? handleStartJourney : undefined}
          disabled={!allBoarded || submitting}
          color={Brand.colors.green.normal}
          insets={insets}
        />
      )}
      {isInProgress && (
        <SlideToAction
          label="Finalizar viaje"
          onSlide={handleCompleteTrip}
          disabled={submitting}
          color="#2d6a4f"
          insets={insets}
        />
      )}

      {/* Modals */}
      <QrScanner visible={scannerOpen} onScan={handleScan} onClose={() => setScannerOpen(false)} />

      <GlassAlert
        visible={!!scanFeedback}
        icon={scanFeedback?.boarded ? 'checkmark-circle' : 'information-circle'}
        iconColor={scanFeedback?.boarded ? Brand.colors.green.normal : '#f4a522'}
        title={scanFeedback?.boarded ? '¡Pasajero abordado!' : 'Ya estaba registrado'}
        body={scanFeedback ? `${scanFeedback.name} ${scanFeedback.boarded ? 'está ahora en el vehículo.' : 'ya había sido registrado anteriormente.'}` : ''}
        primaryLabel="Listo"
        onDismiss={() => setScanFeedback(null)}
      />

      <GlassAlert
        visible={showSeatbelt}
        icon="shield-checkmark"
        iconColor={Brand.colors.green.normal}
        title="Recuerden el cinturón"
        body="Antes de arrancar, asegúrate de que todos los pasajeros lleven el cinturón de seguridad puesto."
        primaryLabel="Todos listos"
        onDismiss={() => setShowSeatbelt(false)}
      />

      {/* No-show confirmation */}
      <GlassAlert
        visible={!!noShowConfirm}
        icon="person-remove"
        iconColor="#e53e3e"
        title={noShowConfirm ? `¿Marcar a ${noShowConfirm.name}?` : ''}
        body={graceLeft > 0
          ? `Quedan ${graceMinSec} de período de gracia.`
          : 'El período de gracia ha finalizado. El pasajero no se presentó.'}
        primaryLabel="Sí, no se presentó"
        onPrimary={confirmNoShow}
        secondaryLabel="Cancelar"
        onSecondary={() => setNoShowConfirm(null)}
        dismissible={false}
        onDismiss={() => setNoShowConfirm(null)}
      />

      {/* Generic error */}
      <GlassAlert
        visible={!!errorMsg}
        icon="alert-circle"
        iconColor="#e53e3e"
        title={errorMsg?.title ?? 'Error'}
        body={errorMsg?.body ?? ''}
        primaryLabel="Entendido"
        onDismiss={() => setErrorMsg(null)}
      />

      <CancellationModal
        visible={showCancel}
        type="driver"
        title="¿Por qué cancelas el viaje?"
        onConfirm={handleCancelTrip}
        onCancel={() => setShowCancel(false)}
        loading={submitting}
      />

      <RatingModal
        visible={showRating && boardedPassengers.length > 0}
        ratedUser={boardedPassengers[currentRatingIdx] ? {
          id: boardedPassengers[currentRatingIdx].passengerId,
          name: `${boardedPassengers[currentRatingIdx].firstName} ${boardedPassengers[currentRatingIdx].lastName}`,
          role: 'passenger',
        } : null}
        onSubmit={handleRatingSubmit}
        onSkip={() => {
          const next = currentRatingIdx + 1;
          if (next < boardedPassengers.length) setCurrentRatingIdx(next);
          else { setShowRating(false); loadPendingPayments(); }
        }}
      />

      {/* Payment confirmation step after ratings */}
      {showPayments && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.screenBg, paddingTop: insets.top, paddingHorizontal: 20 }]}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontSize: 18, marginTop: 24, marginBottom: 4 }]}>
            Confirmar pagos
          </Text>
          <Text style={{ fontFamily: Fonts.sans, fontSize: 13, color: colors.textSecondary, marginBottom: 20 }}>
            Los pagos con SINPE o efectivo requieren tu confirmación.
          </Text>

          {loadingPayments ? (
            <View style={{ alignItems: 'center', marginTop: 40, gap: 12 }}>
              <ActivityIndicator color={Brand.colors.green.normal} />
              <Text style={{ fontFamily: Fonts.sans, fontSize: 13, color: colors.textSecondary, textAlign: 'center' }}>
                Esperando que los pasajeros confirmen su método de pago…
              </Text>
            </View>
          ) : (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 10 }} showsVerticalScrollIndicator={false}>
              {pendingPayments.map(p => (
                <View key={p.id} style={[passengerRowStyles.row, { backgroundColor: colors.inputBg, borderColor: colors.border, flexDirection: 'column', alignItems: 'flex-start', gap: 8 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Ionicons name="person-outline" size={18} color={Brand.colors.green.normal} />
                    <View>
                      <Text style={[passengerRowStyles.name, { color: colors.textPrimary }]}>{p.passengerName}</Text>
                      <Text style={[passengerRowStyles.seats, { color: colors.textSecondary }]}>
                        ₡{p.amount.toLocaleString()} · {p.method === 'sinpe' ? 'SINPE Móvil' : 'Efectivo'}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => handleConfirmPayment(p.id)}
                    disabled={confirmingId === p.id}
                    style={{ alignSelf: 'flex-end', backgroundColor: Brand.colors.green.normal, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, opacity: confirmingId === p.id ? 0.6 : 1 }}
                  >
                    {confirmingId === p.id
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={{ fontFamily: Fonts.headingBold, fontSize: 13, color: '#fff' }}>Confirmar pago</Text>
                    }
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          )}

          {!loadingPayments && (
            <Pressable
              onPress={onTripEnded}
              style={{ marginBottom: insets.bottom + 16, marginTop: 12, padding: 16, alignItems: 'center', borderRadius: 12, backgroundColor: colors.inputBg }}
            >
              <Text style={{ fontFamily: Fonts.headingBold, color: colors.textSecondary }}>
                {pendingPayments.length === 0 ? 'Finalizar' : 'Omitir y finalizar'}
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

// ── Passenger row ────────────────────────────────────────────────────────────
function PassengerRow({
  passenger, isBoarding, graceElapsed, onMarkNoShow, colors,
}: {
  passenger: PassengerSummary;
  isBoarding: boolean;
  graceElapsed: boolean;
  onMarkNoShow: () => void;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const stateIcon: Record<string, { name: keyof typeof Ionicons.glyphMap; color: string }> = {
    confirmed: { name: 'time-outline',       color: '#f4a522' },
    pending:   { name: 'time-outline',       color: '#f4a522' },
    boarded:   { name: 'checkmark-circle',   color: Brand.colors.green.normal },
    no_show:   { name: 'close-circle',       color: '#e53e3e' },
  };
  const state = stateIcon[passenger.bookingState] ?? { name: 'help-circle', color: '#aaa' };

  return (
    <View style={[passengerRowStyles.row, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
      <Ionicons name={state.name} size={20} color={state.color} />
      <View style={{ flex: 1 }}>
        <Text style={[passengerRowStyles.name, { color: colors.textPrimary }]}>
          {passenger.firstName} {passenger.lastName}
        </Text>
        <Text style={[passengerRowStyles.seats, { color: colors.textSecondary }]}>
          {passenger.seatsReserved} asiento{passenger.seatsReserved > 1 ? 's' : ''}
          {passenger.bookingState === 'boarded' && passenger.boardedAt
            ? ` · Abordó a las ${new Date(passenger.boardedAt).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}`
            : ''}
        </Text>
      </View>
      {isBoarding && (passenger.bookingState === 'confirmed' || passenger.bookingState === 'pending') && graceElapsed && (
        <Pressable onPress={onMarkNoShow} style={passengerRowStyles.noShowBtn} hitSlop={8}>
          <Text style={passengerRowStyles.noShowText}>No llegó</Text>
        </Pressable>
      )}
    </View>
  );
}

// ── Slide to action ──────────────────────────────────────────────────────────
// Real PanResponder drag: pull the thumb to the right edge to trigger.
// GlassAlert confirmation appears when the threshold is reached.
const THUMB_SIZE = 62;
const DRAG_THRESHOLD = 0.82; // fraction of track width that triggers confirm

function SlideToAction({ label, onSlide, disabled, color, insets }: {
  label: string;
  onSlide?: () => void;
  disabled?: boolean;
  color: string;
  insets: { bottom: number };
}) {
  const { colors }     = useAppTheme();
  const x              = useRef(new Animated.Value(0)).current;
  const [, setTrackW] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  // Refs so PanResponder closures always read the latest values
  // (PanResponder.create is called once and captures the initial closure)
  const trackWRef   = useRef(0);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current,
      onMoveShouldSetPanResponder:  () => !disabledRef.current,
      onPanResponderMove: (_, { dx }) => {
        const mX = Math.max(0, trackWRef.current - THUMB_SIZE - 8);
        x.setValue(Math.min(Math.max(0, dx), mX));
      },
      onPanResponderRelease: (_, { dx }) => {
        const mX = Math.max(0, trackWRef.current - THUMB_SIZE - 8);
        if (mX > 0 && dx / mX >= DRAG_THRESHOLD) {
          x.setValue(mX);
          setShowConfirm(true);
        } else {
          Animated.spring(x, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    }),
  ).current;

  const resetThumb = () => {
    Animated.spring(x, { toValue: 0, useNativeDriver: true }).start();
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    resetThumb();
    onSlide?.();
  };

  const handleCancel = () => {
    setShowConfirm(false);
    resetThumb();
  };

  return (
    <View style={[slideStyles.wrapper, { paddingBottom: insets.bottom + 12 }]}>
      <View
        style={[slideStyles.track, { backgroundColor: disabled ? colors.border : color + '33' }]}
        onLayout={e => {
          const w = e.nativeEvent.layout.width;
          trackWRef.current = w;
          setTrackW(w);
        }}
      >
        <Animated.View
          style={[slideStyles.thumb, { backgroundColor: disabled ? '#aaa' : color, transform: [{ translateX: x }] }]}
          {...(disabled ? {} : panResponder.panHandlers)}
        >
          <Ionicons name="chevron-forward-outline" size={22} color="#fff" />
        </Animated.View>
        <Text style={[slideStyles.label, { color: disabled ? '#aaa' : color, opacity: disabled ? 0.5 : 1 }]}>
          {label}
        </Text>
      </View>

      <GlassAlert
        visible={showConfirm}
        icon="checkmark-circle"
        iconColor={color}
        title="¿Confirmas esta acción?"
        body={label}
        primaryLabel="Confirmar"
        onPrimary={handleConfirm}
        secondaryLabel="Cancelar"
        onSecondary={handleCancel}
        dismissible={false}
        onDismiss={handleCancel}
      />
    </View>
  );
}

