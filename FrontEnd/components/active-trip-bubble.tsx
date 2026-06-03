// Floating liquid-glass bubble shown to passengers when a trip is boarding or in progress.
// All hooks are declared BEFORE any conditional return (Rules of Hooks).

import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
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
  const [submittingRating, setSubmittingRating]         = useState(false);

  const pulse              = useRef(new Animated.Value(1)).current;
  const seatbeltShown      = useRef(false);
  const shownCancelFor     = useRef<string | null>(null);
  const shownRatingFor     = useRef<string | null>(null);
  const shownLateCancelFor = useRef<string | null>(null);

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

  // Cancelled alert — only show for fresh cancellations (last 30 min), not stale ones
  useEffect(() => {
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
      setShowCancelledAlert(true);
    }
  }, [passengerTrip?.tripState, passengerTrip?.tripId, passengerTrip?.cancelledAt]);

  // Rating prompt after trip completed (once per trip)
  useEffect(() => {
    if (
      passengerTrip?.tripState === 'completed' &&
      passengerTrip.tripId !== shownRatingFor.current
    ) {
      shownRatingFor.current = passengerTrip.tripId;
      setShowRating(true);
    }
  }, [passengerTrip?.tripState, passengerTrip?.tripId]);

  // Late-cancellation rating prompt (once per trip)
  useEffect(() => {
    if (
      passengerTrip?.tripState === 'cancelled' &&
      passengerTrip.isLateCancellation &&
      passengerTrip.tripId !== shownLateCancelFor.current
    ) {
      shownLateCancelFor.current = passengerTrip.tripId;
      setTimeout(() => setShowLateCancelRating(true), 3000);
    }
  }, [passengerTrip?.tripState, passengerTrip?.isLateCancellation, passengerTrip?.tripId]);

  // ── Conditional render guard — after all hooks ───────────────────────────
  // Not authenticated: render nothing
  if (!token || !user) return null;
  // No active passenger trip: render nothing (alerts/ratings still show if state was set)
  if (!passengerTrip && !showSeatbelt && !showRating && !showLateCancelRating && !showCancelledAlert) return null;

  const isActive = passengerTrip?.tripState === 'boarding' || passengerTrip?.tripState === 'in_progress';

  const stateLabel: Record<string, string> = {
    boarding:    'Abordaje en curso',
    in_progress: 'Viaje en curso',
    completed:   'Viaje completado',
    cancelled:   'Viaje cancelado',
  };

  const stateColor = ({
    boarding:    '#f4a522',
    in_progress: Brand.colors.green.normal,
    completed:   Brand.colors.green.dark,
    cancelled:   '#e53e3e',
  } as Record<string, string>)[passengerTrip?.tripState ?? ''] ?? Brand.colors.green.normal;

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
    if (!token || !passengerTrip) return;
    setSubmittingRating(true);
    try {
      await ratingsApi.submit({
        tripId:  passengerTrip.tripId,
        ratedId: passengerTrip.driverId,
        score,
        comment: comment ?? undefined,
      }, token);
    } catch { /* silent */ }
    finally {
      setSubmittingRating(false);
      setShowRating(false);
      setShowLateCancelRating(false);
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
                  {stateLabel[passengerTrip.tripState] ?? passengerTrip.tripState}
                </Text>
                <Text style={[styles.bubbleRoute, { color: colors.textPrimary }]} numberOfLines={1}>
                  {passengerTrip.origin} → {passengerTrip.destination}
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
                    {stateLabel[passengerTrip.tripState] ?? passengerTrip.tripState}
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
                  </View>

                  {/* Boarding state badge */}
                  {passengerTrip.bookingState === 'boarded' && (
                    <View style={[styles.boardedBadge, { backgroundColor: Brand.colors.green.normal + '22' }]}>
                      <Ionicons name="checkmark-circle" size={20} color={Brand.colors.green.normal} />
                      <Text style={[styles.boardedText, { color: Brand.colors.green.normal }]}>
                        Ya estás registrado en el vehículo
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

                  {/* QR toggle — only during boarding */}
                  {passengerTrip.tripState === 'boarding' && (
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
        body={passengerTrip ? buildCancelBody(passengerTrip) : 'Tu viaje fue cancelado.'}
        primaryLabel="Entendido"
        onDismiss={() => setShowCancelledAlert(false)}
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

      {/* Rating after late cancellation */}
      {passengerTrip && (
        <RatingModal
          visible={showLateCancelRating && !showRating}
          ratedUser={{
            id:   passengerTrip.driverId,
            name: `${passengerTrip.driverFirstName} ${passengerTrip.driverLastName}`,
            role: 'driver',
          }}
          onSubmit={handleSubmitRating}
          onSkip={() => { setShowLateCancelRating(false); if (passengerTrip) shownLateCancelFor.current = passengerTrip.tripId; }}
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
