// Floating liquid-glass bubble shown to passengers when a trip is boarding or in progress.
// All hooks are declared BEFORE any conditional return (Rules of Hooks).

import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { styles, infoRowStyles } from './styles/active-trip-bubble.styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brand, Fonts } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useActiveTrip } from '@/contexts/active-trip';
import { useAuth } from '@/contexts/auth';
import { bookingsApi, meApi, ratingsApi } from '@/services/api';
import { fetchRoutePolyline, buildStaticMapUrl } from '@/utils/static-map';
import { openInMaps } from '@/utils/open-in-maps';
import GlassAlert from './glass-alert';
import QrDisplay from './qr-display';
import RatingModal from './rating-modal';
import CancellationModal from './cancellation-modal';

export default function ActiveTripBubble() {
  // ── ALL hooks at the top — no early returns before this section ──────────
  const { passengerTrip, refresh } = useActiveTrip();
  const { token, user }            = useAuth();
  const { colors, isDark }         = useAppTheme();
  const insets                     = useSafeAreaInsets();

  const [expanded, setExpanded]               = useState(false);
  const [showQr, setShowQr]                   = useState(false);
  const [qrToken, setQrToken]                 = useState<string | null>(null);
  const [showSeatbelt, setShowSeatbelt]       = useState(false);
  const [showRating, setShowRating]           = useState(false);
  const [showLateCancelRating, setShowLateCancelRating] = useState(false);
  const [showCancel, setShowCancel]           = useState(false);
  const [showCancelledAlert, setShowCancelledAlert]     = useState(false);
  const [showBoardedAlert, setShowBoardedAlert]         = useState(false);
  const [submittingRating, setSubmittingRating]         = useState(false);
  // Previous booking state — used to detect the confirmed → boarded transition
  const prevBookingState = useRef<string | null>(null);
  // Cached data for late-cancel rating — survives after passengerTrip becomes null
  const [lateCancelDriver, setLateCancelDriver]         = useState<{
    id: string; name: string; tripId: string;
  } | null>(null);
  // Cached body for the cancellation alert (built when passengerTrip is still available)
  const [cancelAlertBody, setCancelAlertBody]           = useState('Tu viaje fue cancelado.');
  // Static route map (shown in the expanded sheet while in_progress)
  const [mapUrl, setMapUrl]                             = useState<string | null>(null);
  const [mapError, setMapError]                         = useState(false);
  const [polyline, setPolyline]                         = useState<string | null>(null);

  const pulse              = useRef(new Animated.Value(1)).current;
  const seatbeltShown      = useRef(false);
  const shownCancelFor     = useRef<string | null>(null);
  const shownRatingFor     = useRef<string | null>(null);
  const shownLateCancelFor = useRef<string | null>(null);
  // Tracks whether the persisted cancel-ack has been loaded from storage
  const [cancelAckLoaded, setCancelAckLoaded] = useState(false);

  // Load previously acknowledged trip IDs from storage on mount.
  // Prevents re-showing the cancelled / rating alerts after re-login.
  useEffect(() => {
    Promise.all([
      SecureStore.getItemAsync('jalemos_cancel_ack'),
      SecureStore.getItemAsync('jalemos_rating_ack'),
      SecureStore.getItemAsync('jalemos_late_cancel_rating_ack'),
    ]).then(([cancelId, ratingId, lateCancelId]) => {
      if (cancelId)     shownCancelFor.current     = cancelId;
      if (ratingId)     shownRatingFor.current     = ratingId;
      if (lateCancelId) shownLateCancelFor.current = lateCancelId;
      setCancelAckLoaded(true);
    }).catch(() => setCancelAckLoaded(true));
  }, []);

  // Pulse animation for the bubble
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.06, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 1000, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  // Fetch QR token lazily when there's an active trip
  useEffect(() => {
    if (!token || !passengerTrip) { setQrToken(null); return; }
    if (passengerTrip.tripState === 'boarding' || passengerTrip.tripState === 'in_progress') {
      meApi.get(token).then(me => setQrToken(me.qrToken)).catch(() => {});
    }
  }, [token, passengerTrip, passengerTrip?.tripId, passengerTrip?.tripState]);

  // Seatbelt alert when journey starts
  useEffect(() => {
    if (passengerTrip?.tripState === 'in_progress' && !seatbeltShown.current) {
      seatbeltShown.current = true;
      setShowSeatbelt(true);
    }
  }, [passengerTrip?.tripState]);

  // Reset per-trip one-time flags whenever the active trip changes,
  // so the seatbelt alert fires again on the passenger's next trip.
  useEffect(() => {
    seatbeltShown.current  = false;
    prevBookingState.current = null;
  }, [passengerTrip?.tripId]);

  // Detect the confirmed → boarded transition (driver scanned the QR).
  // Only fires on the real transition, not when the app loads already-boarded.
  useEffect(() => {
    const current = passengerTrip?.bookingState ?? null;
    if (current === 'boarded') {
      setShowQr(false);
      if (prevBookingState.current && prevBookingState.current !== 'boarded') {
        setShowBoardedAlert(true);
      }
    }
    prevBookingState.current = current;
  }, [passengerTrip?.bookingState]);

  // Fetch the route polyline once the journey is in progress
  useEffect(() => {
    if (passengerTrip?.tripState !== 'in_progress') return;
    fetchRoutePolyline(
      Number(passengerTrip.originLatitude), Number(passengerTrip.originLongitude),
      Number(passengerTrip.destinationLatitude), Number(passengerTrip.destinationLongitude),
    ).then(setPolyline);
  }, [passengerTrip?.tripState, passengerTrip?.tripId]);

  // Build the static map URL whenever the polyline or theme changes
  useEffect(() => {
    if (passengerTrip?.tripState !== 'in_progress') { setMapUrl(null); return; }
    setMapError(false);
    setMapUrl(buildStaticMapUrl(
      Number(passengerTrip.originLatitude), Number(passengerTrip.originLongitude),
      Number(passengerTrip.destinationLatitude), Number(passengerTrip.destinationLongitude),
      polyline, isDark,
    ));
  }, [passengerTrip?.tripState, passengerTrip?.tripId, polyline, isDark]);

  // Cancelled alert — show once per trip, persisted across sessions via SecureStore.
  // Also caches driver info if it's a late cancellation so the rating can be shown
  // even after passengerTrip becomes null (15-min API window expires).
  useEffect(() => {
    if (!cancelAckLoaded) return;
    if (
      passengerTrip?.tripState === 'cancelled' &&
      passengerTrip.tripId !== shownCancelFor.current
    ) {
      const cancelledAt = passengerTrip.cancelledAt
        ? new Date(passengerTrip.cancelledAt).getTime()
        : null;
      const isFresh = cancelledAt ? (Date.now() - cancelledAt) < 30 * 60_000 : false;
      if (!isFresh) return;

      shownCancelFor.current = passengerTrip.tripId;
      SecureStore.setItemAsync('jalemos_cancel_ack', passengerTrip.tripId).catch(() => {});

      // Cache the alert body now while passengerTrip is still available
      setCancelAlertBody(buildCancelBody(passengerTrip));

      // Cache driver info for late-cancel rating (survives passengerTrip becoming null)
      if (passengerTrip.isLateCancellation && passengerTrip.tripId !== shownLateCancelFor.current) {
        shownLateCancelFor.current = passengerTrip.tripId;
        SecureStore.setItemAsync('jalemos_late_cancel_rating_ack', passengerTrip.tripId).catch(() => {});
        setLateCancelDriver({
          id:     passengerTrip.driverId,
          name:   `${passengerTrip.driverFirstName} ${passengerTrip.driverLastName}`,
          tripId: passengerTrip.tripId,
        });
      }

      setShowCancelledAlert(true);
    }
  }, [passengerTrip?.tripState, passengerTrip?.tripId, passengerTrip?.cancelledAt, cancelAckLoaded]);

  // Rating prompt after trip completed (once per trip, persisted across sessions)
  useEffect(() => {
    if (!cancelAckLoaded) return;
    if (
      passengerTrip?.tripState === 'completed' &&
      passengerTrip.tripId !== shownRatingFor.current
    ) {
      shownRatingFor.current = passengerTrip.tripId;
      SecureStore.setItemAsync('jalemos_rating_ack', passengerTrip.tripId).catch(() => {});
      setShowRating(true);
    }
  }, [passengerTrip?.tripState, passengerTrip?.tripId, cancelAckLoaded]);

  // Late-cancel rating is now triggered from the cancellation alert's onDismiss
  // (see the GlassAlert below). This avoids two Modals being visible at once,
  // which was causing the app to freeze on iOS/Android.

  // ── Conditional render guard — after all hooks ───────────────────────────
  // Not authenticated: render nothing
  if (!token || !user) return null;
  // No active passenger trip: render nothing (alerts/ratings still show if state was set).
  // lateCancelDriver keeps the component mounted during the gap between the cancel alert
  // closing and the late-cancel rating modal opening.
  if (!passengerTrip && !showSeatbelt && !showRating && !showLateCancelRating && !showCancelledAlert && !showBoardedAlert && !lateCancelDriver) return null;

  const isActive = passengerTrip?.tripState === 'boarding' || passengerTrip?.tripState === 'in_progress';
  const isBoarded = passengerTrip?.bookingState === 'boarded';

  // Primary state label — reflects both trip state and whether the passenger is aboard
  const tripState = passengerTrip?.tripState ?? '';
  const headlineLabel =
    tripState === 'in_progress' ? 'En viaje'
    : tripState === 'boarding'  ? (isBoarded ? 'Abordado' : 'Abordaje en curso')
    : tripState === 'completed' ? 'Viaje completado'
    : tripState === 'cancelled' ? 'Viaje cancelado'
    : tripState;

  // Secondary subtitle — actionable hint for the passenger
  const subtitleHint =
    tripState === 'in_progress' ? `Vas hacia ${passengerTrip?.destination ?? 'tu destino'}`
    : tripState === 'boarding' && !isBoarded ? 'Muestra tu QR para abordar'
    : tripState === 'boarding' && isBoarded  ? 'Abordado · esperando salida'
    : `${passengerTrip?.origin ?? ''} → ${passengerTrip?.destination ?? ''}`;

  const stateColor =
    tripState === 'in_progress' ? Brand.colors.green.normal
    : tripState === 'boarding'  ? (isBoarded ? Brand.colors.green.normal : '#f4a522')
    : tripState === 'completed' ? Brand.colors.green.dark
    : tripState === 'cancelled' ? '#e53e3e'
    : Brand.colors.green.normal;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleCancelBooking = async (reason: string, details: string | null) => {
    if (!token || !passengerTrip) return;
    try {
      await bookingsApi.cancel(passengerTrip.bookingId, reason, details, token);
      setShowCancel(false);
      setExpanded(false);
      refresh();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo cancelar la reserva.');
    }
  };

  const handleSubmitRating = async (score: number, comment: string | null) => {
    if (!token) return;
    // For completed trips use passengerTrip; for late-cancel use cached lateCancelDriver
    const tripIdToRate   = passengerTrip?.tripId   ?? lateCancelDriver?.tripId;
    const driverIdToRate = passengerTrip?.driverId  ?? lateCancelDriver?.id;
    if (!tripIdToRate || !driverIdToRate) return;

    setSubmittingRating(true);
    try {
      await ratingsApi.submit({
        tripId:  tripIdToRate,
        ratedId: driverIdToRate,
        score,
        comment: comment ?? undefined,
      }, token);
    } catch { /* silent */ }
    finally {
      setSubmittingRating(false);
      setShowRating(false);
      setShowLateCancelRating(false);
      setLateCancelDriver(null);
      refresh();
    }
  };

  // ── JSX ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Floating bubble — only when trip is active */}
      {isActive && passengerTrip && (
        <Animated.View style={[styles.bubble, { bottom: insets.bottom + 84, transform: [{ scale: pulse }] }]}>
          <Pressable onPress={() => setExpanded(true)}>
            <BlurView intensity={65} tint={isDark ? 'dark' : 'light'} style={styles.bubbleInner}>
              <View style={[styles.dot, { backgroundColor: stateColor }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.bubbleState, { color: stateColor }]}>
                  {headlineLabel}
                </Text>
                <Text style={[styles.bubbleRoute, { color: colors.textPrimary }]} numberOfLines={1}>
                  {subtitleHint}
                </Text>
              </View>
              <Ionicons name="chevron-up" size={16} color={colors.textMuted} />
            </BlurView>
          </Pressable>
        </Animated.View>
      )}

      {/* ── Expanded modal ── */}
      {passengerTrip && (
        <Modal visible={expanded} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setExpanded(false)}>
          <BlurView intensity={30} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill}>
            <View style={styles.modalBg}>
              <View style={[styles.sheet, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
                <Pressable onPress={() => setExpanded(false)} style={styles.handleWrap}>
                  <View style={styles.handle} />
                </Pressable>

                <View style={[styles.statusBadge, { backgroundColor: stateColor + '22' }]}>
                  <View style={[styles.statusDot, { backgroundColor: stateColor }]} />
                  <Text style={[styles.statusText, { color: stateColor }]}>
                    {headlineLabel}
                  </Text>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 16 }}>
                  {/* Route */}
                  <View style={[styles.card, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                    <InfoRow icon="radio-button-on" label="Origen"  value={passengerTrip.origin}     colors={colors} />
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <InfoRow icon="location"        label="Destino" value={passengerTrip.destination} colors={colors} />
                  </View>

                  {/* Driver */}
                  <View style={[styles.card, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                    <InfoRow icon="person" label="Conductor"    value={`${passengerTrip.driverFirstName} ${passengerTrip.driverLastName}`} colors={colors} />
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <InfoRow icon="star"   label="Calificación" value={`${passengerTrip.driverRating.toFixed(1)} ★`} colors={colors} />
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <InfoRow icon="cash"   label="Tarifa"       value={`₡${passengerTrip.rate.toLocaleString()}`}    colors={colors} />
                    {passengerTrip.journeyStartedAt && (
                      <>
                        <View style={[styles.divider, { backgroundColor: colors.border }]} />
                        <InfoRow icon="time" label="Inició" value={new Date(passengerTrip.journeyStartedAt).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })} colors={colors} />
                      </>
                    )}
                  </View>

                  {/* ── In-progress: "Estás en el viaje" map + navigation ── */}
                  {passengerTrip.tripState === 'in_progress' && (
                    <>
                      <View style={[styles.enjoyBanner, { backgroundColor: Brand.colors.green.normal + '18' }]}>
                        <Ionicons name="car-sport" size={22} color={Brand.colors.green.normal} />
                        <Text style={[styles.enjoyText, { color: Brand.colors.green.normal }]}>
                          Vas en camino. ¡Disfruta tu viaje!
                        </Text>
                      </View>

                      <Pressable
                        style={styles.mapWrap}
                        onPress={() => openInMaps(
                          Number(passengerTrip.originLatitude), Number(passengerTrip.originLongitude),
                          Number(passengerTrip.destinationLatitude), Number(passengerTrip.destinationLongitude),
                          passengerTrip.origin, passengerTrip.destination,
                        )}
                      >
                        {mapUrl && !mapError ? (
                          <Image source={{ uri: mapUrl }} style={styles.mapImage} resizeMode="cover" onError={() => setMapError(true)} />
                        ) : (
                          <View style={[styles.mapFallback, { backgroundColor: colors.inputBg }]}>
                            <Ionicons name="map-outline" size={34} color={colors.textMuted} />
                            <Text style={[styles.mapFallbackText, { color: colors.textMuted }]} numberOfLines={1}>
                              {passengerTrip.origin} → {passengerTrip.destination}
                            </Text>
                          </View>
                        )}
                        <View style={styles.mapPin}>
                          <Ionicons name="navigate" size={14} color="#fff" />
                        </View>
                      </Pressable>

                      <Pressable
                        style={styles.navBtn}
                        onPress={() => openInMaps(
                          Number(passengerTrip.originLatitude), Number(passengerTrip.originLongitude),
                          Number(passengerTrip.destinationLatitude), Number(passengerTrip.destinationLongitude),
                          passengerTrip.origin, passengerTrip.destination,
                        )}
                      >
                        <Ionicons name="navigate-outline" size={18} color="#fff" />
                        <Text style={styles.navBtnText}>Seguir ruta en mapa</Text>
                      </Pressable>
                    </>
                  )}

                  {/* Boarding state badge — only during boarding (in_progress has its own banner) */}
                  {passengerTrip.bookingState === 'boarded' && passengerTrip.tripState === 'boarding' && (
                    <View style={[styles.boardedBadge, { backgroundColor: Brand.colors.green.normal + '22' }]}>
                      <Ionicons name="checkmark-circle" size={20} color={Brand.colors.green.normal} />
                      <Text style={[styles.boardedText, { color: Brand.colors.green.normal }]}>
                        Abordado · espera a que el conductor inicie el viaje
                      </Text>
                    </View>
                  )}
                  {passengerTrip.bookingState === 'confirmed' && passengerTrip.tripState === 'boarding' && (
                    <View style={[styles.boardedBadge, { backgroundColor: '#f4a52222' }]}>
                      <Ionicons name="qr-code" size={20} color="#f4a522" />
                      <Text style={[styles.boardedText, { color: '#f4a522' }]}>
                        Muestra tu QR al conductor para subir
                      </Text>
                    </View>
                  )}

                  {/* QR toggle — only during boarding, before the passenger is aboard */}
                  {passengerTrip.tripState === 'boarding' && passengerTrip.bookingState !== 'boarded' && (
                    <Pressable
                      style={[styles.qrBtn, { backgroundColor: Brand.colors.green.normal }]}
                      onPress={() => setShowQr(v => !v)}
                    >
                      <Ionicons name={showQr ? 'eye-off' : 'qr-code'} size={18} color="#fff" />
                      <Text style={styles.qrBtnText}>{showQr ? 'Ocultar QR' : 'Mostrar mi QR'}</Text>
                    </Pressable>
                  )}
                  {showQr && qrToken && (
                    <QrDisplay qrToken={qrToken} size={200} label="Muestra este QR a tu conductor" />
                  )}
                  {showQr && !qrToken && (
                    <Text style={[{ color: colors.textMuted, textAlign: 'center', fontFamily: Fonts.sans, fontSize: 13 }]}>
                      Cargando QR…
                    </Text>
                  )}

                  {/* Cancellation reason (when cancelled) */}
                  {passengerTrip.tripState === 'cancelled' && passengerTrip.cancelReason && (
                    <View style={[styles.boardedBadge, { backgroundColor: '#e53e3e22' }]}>
                      <Ionicons name="close-circle" size={20} color="#e53e3e" />
                      <Text style={[styles.boardedText, { color: '#e53e3e', flex: 1 }]}>
                        {buildCancelBody(passengerTrip)}
                      </Text>
                    </View>
                  )}

                  {/* Cancel booking — only if active and not yet boarded */}
                  {isActive && passengerTrip.bookingState !== 'boarded' && (
                    <Pressable style={styles.cancelLink} onPress={() => setShowCancel(true)}>
                      <Text style={[styles.cancelLinkText, { color: '#e53e3e' }]}>Cancelar mi reserva</Text>
                    </Pressable>
                  )}
                </ScrollView>
              </View>
            </View>
          </BlurView>
        </Modal>
      )}

      {/* ── Glass alerts ── */}
      <GlassAlert
        visible={showBoardedAlert}
        icon="checkmark-circle"
        iconColor={Brand.colors.green.normal}
        title="¡Has abordado!"
        body="El conductor escaneó tu código. Ya estás registrado en el vehículo, espera a que inicie el viaje."
        primaryLabel="Entendido"
        onDismiss={() => setShowBoardedAlert(false)}
      />

      <GlassAlert
        visible={showSeatbelt}
        icon="shield-checkmark"
        iconColor={Brand.colors.green.normal}
        title="¡Abróchate el cinturón!"
        body="Por tu seguridad y la de todos, asegúrate de tener el cinturón de seguridad bien puesto antes de que el viaje comience."
        primaryLabel="Listo, estoy seguro"
        onDismiss={() => setShowSeatbelt(false)}
      />

      <GlassAlert
        visible={showCancelledAlert}
        icon="close-circle"
        iconColor="#e53e3e"
        title="Viaje cancelado"
        body={cancelAlertBody}
        primaryLabel="Entendido"
        onDismiss={() => {
          setShowCancelledAlert(false);
          // Show rating prompt AFTER the cancel alert closes (avoids two Modals at once)
          if (lateCancelDriver) {
            setTimeout(() => setShowLateCancelRating(true), 350);
          }
        }}
      />

      {/* Rating after completed trip */}
      {passengerTrip && (
        <RatingModal
          visible={showRating}
          ratedUser={{
            id:   passengerTrip.driverId,
            name: `${passengerTrip.driverFirstName} ${passengerTrip.driverLastName}`,
            role: 'driver',
          }}
          onSubmit={handleSubmitRating}
          onSkip={() => { setShowRating(false); if (passengerTrip) shownRatingFor.current = passengerTrip.tripId; }}
          loading={submittingRating}
        />
      )}

      {/* Rating after late cancellation — uses cached driver info, not passengerTrip */}
      {lateCancelDriver && (
        <RatingModal
          visible={showLateCancelRating && !showRating}
          ratedUser={{
            id:   lateCancelDriver.id,
            name: lateCancelDriver.name,
            role: 'driver',
          }}
          onSubmit={handleSubmitRating}
          onSkip={() => { setShowLateCancelRating(false); setLateCancelDriver(null); }}
          loading={submittingRating}
        />
      )}

      {/* Cancel booking */}
      <CancellationModal
        visible={showCancel}
        type="passenger"
        title="¿Por qué cancelas tu reserva?"
        onConfirm={handleCancelBooking}
        onCancel={() => setShowCancel(false)}
      />
    </>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function cancelReasonLabel(reason: string): string {
  return ({
    vehicle_issue:      'Problema con el vehículo',
    personal_emergency: 'Emergencia personal',
    traffic_problem:    'Problema de tránsito',
    route_change:       'Cambio de ruta',
    expired:            'No se inició a tiempo',
    other:              'Otro motivo',
  } as Record<string, string>)[reason] ?? reason;
}

function buildCancelBody(trip: {
  cancelReason: string | null;
  cancelDetails: string | null;
  isLateCancellation: boolean;
}): string {
  let body = 'Tu conductor canceló el viaje.';
  if (trip.cancelReason) body += ` Motivo: ${cancelReasonLabel(trip.cancelReason)}.`;
  if (trip.cancelDetails) body += ` "${trip.cancelDetails}"`;
  if (trip.isLateCancellation) body += '\n\nComo fue cancelado con poco tiempo, puedes calificarlo a continuación.';
  return body;
}

// ── InfoRow sub-component ────────────────────────────────────────────────────
function InfoRow({ icon, label, value, colors }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <View style={infoRowStyles.row}>
      <Ionicons name={icon} size={14} color={Brand.colors.green.normal} />
      <Text style={[infoRowStyles.label, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[infoRowStyles.value, { color: colors.textPrimary }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}
