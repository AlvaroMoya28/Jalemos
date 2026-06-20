// Floating liquid-glass bubble shown to passengers when a trip is boarding or in progress.
// All hooks are declared BEFORE any conditional return (Rules of Hooks).
// State machines live in dedicated hooks (alerts / payment / route map); this file
// renders the bubble, the expanded sheet and the alert/rating modals.

import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { useActiveTrip } from '@/contexts/active-trip';
import { useAuth } from '@/contexts/auth';
import { useAppTheme } from '@/hooks/use-app-theme';
import { usePassengerTripAlerts } from '@/hooks/use-passenger-trip-alerts';
import { useTripPayment } from '@/hooks/use-trip-payment';
import { useTripRouteMap } from '@/hooks/use-trip-route-map';
import { bookingsApi, meApi, ratingsApi } from '@/services/api';
import ActiveTripSheet from './active-trip-sheet';
import PassengerTripModals from './passenger-trip-modals';
import { styles } from './styles/active-trip-bubble.styles';

export default function ActiveTripBubble() {
  // ── ALL hooks at the top — no early returns before this section ──────────
  const { passengerTrip, refresh } = useActiveTrip();
  const { token, user }            = useAuth();
  const { colors, isDark }         = useAppTheme();
  const insets                     = useSafeAreaInsets();

  const [expanded, setExpanded]                       = useState(false);
  const [showQr, setShowQr]                           = useState(false);
  const [qrToken, setQrToken]                         = useState<string | null>(null);
  const [showCancel, setShowCancel]                   = useState(false);
  const [showEmergencyReport, setShowEmergencyReport] = useState(false);
  const [submittingRating, setSubmittingRating]       = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;

  const alerts  = usePassengerTripAlerts(passengerTrip, () => setShowQr(false));
  const pay     = useTripPayment(passengerTrip, token);
  const { mapUrl, mapError, onMapError } = useTripRouteMap({
    active: passengerTrip?.tripState === 'in_progress',
    originLat: passengerTrip?.originLatitude ?? 0, originLng: passengerTrip?.originLongitude ?? 0,
    destLat: passengerTrip?.destinationLatitude ?? 0, destLng: passengerTrip?.destinationLongitude ?? 0,
    isDark,
  });

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

  // ── Conditional render guard — after all hooks ───────────────────────────
  if (!token || !user) return null;
  // lateCancelDriver keeps the component mounted during the gap between the cancel alert
  // closing and the late-cancel rating modal opening.
  if (!passengerTrip && !alerts.showSeatbelt && !alerts.showRating && !alerts.showLateCancelRating
      && !alerts.showCancelledAlert && !alerts.showBoardedAlert && !alerts.lateCancelDriver) return null;

  const isActive  = passengerTrip?.tripState === 'boarding' || passengerTrip?.tripState === 'in_progress';
  const isBoarded = passengerTrip?.bookingState === 'boarded';
  const tripState = passengerTrip?.tripState ?? '';

  const headlineLabel =
    tripState === 'in_progress' ? 'En viaje'
    : tripState === 'boarding'  ? (isBoarded ? 'Abordado' : 'Abordaje en curso')
    : tripState === 'completed' ? 'Viaje completado'
    : tripState === 'cancelled' ? 'Viaje cancelado'
    : tripState;

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
    const tripIdToRate   = passengerTrip?.tripId   ?? alerts.lateCancelDriver?.tripId;
    const driverIdToRate = passengerTrip?.driverId ?? alerts.lateCancelDriver?.id;
    if (!tripIdToRate || !driverIdToRate) return;

    setSubmittingRating(true);
    try {
      await ratingsApi.submit({ tripId: tripIdToRate, ratedId: driverIdToRate, score, comment: comment ?? undefined }, token);
    } catch { /* silent */ }
    finally {
      setSubmittingRating(false);
      alerts.setShowRating(false);
      alerts.setShowLateCancelRating(false);
      alerts.setLateCancelDriver(null);
      // Don't refresh on completed trips — the payment screen needs to stay visible.
      if (passengerTrip?.tripState !== 'completed') refresh();
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
                <Text style={[styles.bubbleState, { color: stateColor }]}>{headlineLabel}</Text>
                <Text style={[styles.bubbleRoute, { color: colors.textPrimary }]} numberOfLines={1}>
                  {subtitleHint}
                </Text>
              </View>
              <Ionicons name="chevron-up" size={16} color={colors.textMuted} />
            </BlurView>
          </Pressable>
        </Animated.View>
      )}

      {/* ── Expanded sheet ── */}
      {passengerTrip && (
        <ActiveTripSheet
          trip={passengerTrip}
          colors={colors}
          isDark={isDark}
          visible={expanded}
          onClose={() => setExpanded(false)}
          headlineLabel={headlineLabel}
          stateColor={stateColor}
          isActive={!!isActive}
          showQr={showQr}
          onToggleQr={() => setShowQr(v => !v)}
          qrToken={qrToken}
          mapUrl={mapUrl}
          mapError={mapError}
          onMapError={onMapError}
          paymentMethods={pay.paymentMethods}
          selectedMethod={pay.selectedMethod}
          showMethodPicker={pay.showMethodPicker}
          onToggleMethodPicker={() => pay.setShowMethodPicker(v => !v)}
          onSelectMethod={m => { pay.setSelectedMethod(m); pay.setShowMethodPicker(false); }}
          payment={pay.payment}
          paymentCreating={pay.paymentCreating}
          onEmergency={() => { setExpanded(false); setTimeout(() => setShowEmergencyReport(true), 350); }}
          onCancelBooking={() => setShowCancel(true)}
        />
      )}

      {/* ── Alerts / rating / cancellation / emergency modals ── */}
      <PassengerTripModals
        trip={passengerTrip}
        alerts={alerts}
        onSubmitRating={handleSubmitRating}
        submittingRating={submittingRating}
        showCancel={showCancel}
        onCancelClose={() => setShowCancel(false)}
        onConfirmCancel={handleCancelBooking}
        showEmergencyReport={showEmergencyReport}
        onEmergencyDismiss={() => setShowEmergencyReport(false)}
      />
    </>
  );
}
