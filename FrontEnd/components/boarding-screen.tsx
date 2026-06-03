// Driver boarding management screen — shown in the Offer tab when the driver has an active trip.
// Handles QR scanning, passenger status, no-show marking, journey start, trip completion,
// trip cancellation, and external navigation launch.

import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Brand, Fonts } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useActiveTrip } from '@/contexts/active-trip';
import { useAuth } from '@/contexts/auth';
import { PassengerSummary, TripStatusResponse, tripLifecycleApi, ratingsApi } from '@/services/api';
import { openInMaps } from '@/utils/open-in-maps';
import QrScanner from './qr-scanner';
import GlassAlert from './glass-alert';
import CancellationModal from './cancellation-modal';
import RatingModal from './rating-modal';

const SLIDE_HEIGHT = 70;

interface Props {
  trip: TripStatusResponse;
  onTripEnded: () => void;
}

export default function BoardingScreen({ trip, onTripEnded }: Props) {
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

  // Slide-to-start drag
  const slideX    = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [sliding, setSliding] = useState(false);

  const boardedPassengers  = trip.passengers.filter(p => p.bookingState === 'boarded');
  const pendingPassengers  = trip.passengers.filter(p => p.bookingState === 'confirmed' || p.bookingState === 'pending');
  const noShowPassengers   = trip.passengers.filter(p => p.bookingState === 'no_show');
  const totalActive        = trip.passengers.filter(p => !['cancelled', 'no_show'].includes(p.bookingState));
  const allBoarded         = pendingPassengers.length === 0;

  const isBoarding   = trip.state === 'boarding';
  const isInProgress = trip.state === 'in_progress';
  const isCompleted  = trip.state === 'completed';

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
      Alert.alert('QR inválido', e.message ?? 'No se pudo escanear el QR.');
    } finally {
      setScanning(false);
    }
  }, [scanning, token, trip.tripId, refresh]);

  // Mark no-show
  const handleNoShow = async (bookingId: string, name: string) => {
    Alert.alert(
      `¿Marcar a ${name} como no presentado?`,
      graceLeft > 0 ? `Quedan ${graceMinSec} de período de gracia.` : 'El período de gracia ha finalizado.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sí, no se presentó', style: 'destructive', onPress: async () => {
          try {
            await tripLifecycleApi.markNoShow(bookingId, token!);
            refresh();
          } catch (e: any) { Alert.alert('Error', e.message); }
        }},
      ],
    );
  };

  // Start journey
  const handleStartJourney = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      await tripLifecycleApi.startJourney(trip.tripId, token);
      await refresh();  // await so trip state updates before re-render
      if (!seatbeltShown.current) { seatbeltShown.current = true; setShowSeatbelt(true); }
    } catch (e: any) { Alert.alert('No se puede iniciar', e.message); }
    finally { setSubmitting(false); }
  };

  // Complete trip
  const handleCompleteTrip = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      await tripLifecycleApi.completeTrip(trip.tripId, token);
      // Show rating BEFORE refreshing context so BoardingScreen stays mounted for the modal.
      // onTripEnded (called after rating or when no passengers) triggers refreshActiveTrip,
      // which sets driverTrip = null and unmounts this screen.
      if (boardedPassengers.length > 0) { setCurrentRatingIdx(0); setShowRating(true); }
      else onTripEnded();
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSubmitting(false); }
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
    } catch (e: any) { Alert.alert('Error', e.message); }
    finally { setSubmitting(false); }
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
      onTripEnded();
    }
  };

  const stateColor  = isBoarding ? '#f4a522' : isInProgress ? Brand.colors.green.normal : '#aaa';
  const stateLabel  = isBoarding ? 'Abordaje en curso' : isInProgress ? 'Viaje en curso' : 'Completado';

  return (
    <View style={[s.container, { backgroundColor: colors.screenBg, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <View style={[s.stateBadge, { backgroundColor: stateColor + '22' }]}>
          <View style={[s.stateDot, { backgroundColor: stateColor }]} />
          <Text style={[s.stateText, { color: stateColor }]}>{stateLabel}</Text>
        </View>
        <Pressable
          style={[s.cancelBtn, { borderColor: colors.border }]}
          onPress={() => setShowCancel(true)}
        >
          <Ionicons name="close-circle-outline" size={16} color="#e53e3e" />
          <Text style={s.cancelBtnText}>Cancelar</Text>
        </Pressable>
      </View>

      {/* Route info */}
      <View style={[s.routeCard, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
        <View style={s.routeRow}>
          <Ionicons name="radio-button-on" size={14} color={Brand.colors.green.dark} />
          <Text style={[s.routeText, { color: colors.textPrimary }]} numberOfLines={1}>{trip.origin}</Text>
        </View>
        <View style={[s.routeDivider, { backgroundColor: colors.border }]} />
        <View style={s.routeRow}>
          <Ionicons name="location" size={14} color={Brand.colors.green.normal} />
          <Text style={[s.routeText, { color: colors.textPrimary }]} numberOfLines={1}>{trip.destination}</Text>
        </View>
      </View>

      {/* Scan QR button — always visible, not inside ScrollView */}
      {isBoarding && (
        <Pressable
          style={[s.scanBtn, { marginHorizontal: 16, marginBottom: 10 }, scanning && { opacity: 0.6 }]}
          onPress={() => setScannerOpen(true)}
          disabled={scanning}
        >
          {scanning
            ? <ActivityIndicator color="#fff" size="small" />
            : <Ionicons name="qr-code-outline" size={20} color="#fff" />
          }
          <Text style={s.scanBtnText}>{scanning ? 'Procesando…' : 'Escanear QR de pasajero'}</Text>
        </Pressable>
      )}

      {/* Navigation button — always visible when in_progress */}
      {isInProgress && (
        <Pressable
          style={[s.scanBtn, { backgroundColor: '#3182ce', marginHorizontal: 16, marginBottom: 10 }]}
          onPress={() => openInMaps(
            Number(trip.originLatitude), Number(trip.originLongitude),
            Number(trip.destinationLatitude), Number(trip.destinationLongitude),
            trip.origin, trip.destination,
          )}
        >
          <Ionicons name="navigate-outline" size={20} color="#fff" />
          <Text style={s.scanBtnText}>Abrir navegación</Text>
        </Pressable>
      )}

      {/* Passengers */}
      <Text style={[s.sectionTitle, { color: colors.textSecondary }]}>
        Pasajeros — {boardedPassengers.length}/{totalActive.length} abordados
      </Text>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 8, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {trip.passengers.filter(p => p.bookingState !== 'cancelled').length === 0 ? (
          <View style={[s.graceCard, { backgroundColor: colors.inputBg }]}>
            <Ionicons name="people-outline" size={16} color={colors.textMuted} />
            <Text style={[s.graceText, { color: colors.textSecondary }]}>
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
          <View style={[s.graceCard, { backgroundColor: '#f4a52218' }]}>
            <Ionicons name="timer-outline" size={16} color="#f4a522" />
            <Text style={s.graceText}>
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
          else { setShowRating(false); onTripEnded(); }
        }}
      />
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
    <View style={[pr.row, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
      <Ionicons name={state.name} size={20} color={state.color} />
      <View style={{ flex: 1 }}>
        <Text style={[pr.name, { color: colors.textPrimary }]}>
          {passenger.firstName} {passenger.lastName}
        </Text>
        <Text style={[pr.seats, { color: colors.textSecondary }]}>
          {passenger.seatsReserved} asiento{passenger.seatsReserved > 1 ? 's' : ''}
          {passenger.bookingState === 'boarded' && passenger.boardedAt
            ? ` · Abordó a las ${new Date(passenger.boardedAt).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}`
            : ''}
        </Text>
      </View>
      {isBoarding && (passenger.bookingState === 'confirmed' || passenger.bookingState === 'pending') && graceElapsed && (
        <Pressable onPress={onMarkNoShow} style={pr.noShowBtn} hitSlop={8}>
          <Text style={pr.noShowText}>No llegó</Text>
        </Pressable>
      )}
    </View>
  );
}

// ── Slide to action ──────────────────────────────────────────────────────────
function SlideToAction({ label, onSlide, disabled, color, insets }: {
  label: string;
  onSlide?: () => void;
  disabled?: boolean;
  color: string;
  insets: { bottom: number };
}) {
  const { colors } = useAppTheme();
  const x          = useRef(new Animated.Value(0)).current;
  const [trackW, setTrackW] = useState(0);
  const threshold  = trackW - SLIDE_HEIGHT - 8;

  return (
    <View style={[sli.wrapper, { paddingBottom: insets.bottom + 12 }]}>
      <View
        style={[sli.track, { backgroundColor: disabled ? colors.border : color + '33' }]}
        onLayout={e => setTrackW(e.nativeEvent.layout.width)}
      >
        <Animated.View
          style={[sli.thumb, { backgroundColor: disabled ? '#aaa' : color, transform: [{ translateX: x }] }]}
          {...(disabled ? {} : {
            // Simple drag simulation — in prod use PanResponder
          })}
        >
          <Ionicons name="chevron-forward-outline" size={22} color="#fff" />
        </Animated.View>
        <Text style={[sli.label, { color: disabled ? '#aaa' : color }]}>{label}</Text>
      </View>
      {/* Tap fallback when not draggable */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={disabled ? undefined : () => {
          Alert.alert(
            label,
            '¿Estás seguro?',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Confirmar', onPress: onSlide },
            ],
          );
        }}
        disabled={disabled}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  stateBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  stateDot: { width: 6, height: 6, borderRadius: 3 },
  stateText: { fontFamily: Fonts.headingBold, fontSize: 12 },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  cancelBtnText: { fontFamily: Fonts.heading, fontSize: 12, color: '#e53e3e' },
  routeCard: { marginHorizontal: 16, borderRadius: 12, borderWidth: 1, padding: 14, gap: 8, marginBottom: 16 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeText: { fontFamily: Fonts.heading, fontSize: 13, flex: 1 },
  routeDivider: { height: StyleSheet.hairlineWidth, marginLeft: 22 },
  sectionTitle: { fontFamily: Fonts.headingBold, fontSize: 11, paddingHorizontal: 16, marginBottom: 4 },
  graceCard: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, marginHorizontal: 16 },
  graceText: { fontFamily: Fonts.sans, fontSize: 13, color: '#f4a522' },
  scanBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 16, borderRadius: 14, paddingVertical: 14,
    backgroundColor: Brand.colors.green.dark,
  },
  scanBtnText: { color: '#fff', fontFamily: Fonts.headingBold, fontSize: 15 },
});

const pr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, padding: 12, marginHorizontal: 16 },
  name: { fontFamily: Fonts.heading, fontSize: 14 },
  seats: { fontFamily: Fonts.sans, fontSize: 11 },
  noShowBtn: { backgroundColor: '#e53e3e', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  noShowText: { color: '#fff', fontFamily: Fonts.heading, fontSize: 11 },
});

const sli = StyleSheet.create({
  wrapper: { paddingHorizontal: 16, paddingTop: 8 },
  track: {
    height: SLIDE_HEIGHT, borderRadius: SLIDE_HEIGHT / 2,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  thumb: {
    position: 'absolute', left: 4, width: SLIDE_HEIGHT - 8, height: SLIDE_HEIGHT - 8,
    borderRadius: (SLIDE_HEIGHT - 8) / 2, alignItems: 'center', justifyContent: 'center',
  },
  label: { fontFamily: Fonts.headingBold, fontSize: 15, textAlign: 'center' },
});
