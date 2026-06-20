// Driver boarding management screen — shown in the Offer tab when the driver has an active trip.
// Handles QR scanning, passenger status, no-show marking, journey start, trip completion,
// trip cancellation, and external navigation launch.
// State machine lives in useBoardingScreen; this file renders it.

import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand, Fonts } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useBoardingScreen } from '@/hooks/use-boarding-screen';
import { useTripRouteMap } from '@/hooks/use-trip-route-map';
import { TripStatusResponse } from '@/services/api';
import CancellationModal from '../shared/cancellation-modal';
import GlassAlert from '../shared/glass-alert';
import RatingModal from '../shared/rating-modal';
import { SlideToAction } from '../shared/slide-to-action';
import BoardingMap from './boarding-map';
import { PassengerRow } from './passenger-row';
import { PaymentConfirmationStep } from './payment-confirmation-step';
import QrScanner from './qr-scanner';
import { styles } from './styles/boarding-screen.styles';

interface Props {
  trip: TripStatusResponse;
  onTripEnded: () => void;
  /** Called right after the trip is completed, so the parent can freeze this screen
   *  mounted while the driver rates each passenger. */
  onTripCompleted?: (trip: TripStatusResponse) => void;
}

export default function BoardingScreen({ trip, onTripEnded, onTripCompleted }: Props) {
  const { colors, isDark } = useAppTheme();
  const insets             = useSafeAreaInsets();

  const b = useBoardingScreen(trip, onTripEnded, onTripCompleted);
  const { mapUrl, mapError, onMapError } = useTripRouteMap({
    active: b.isInProgress,
    originLat: trip.originLatitude, originLng: trip.originLongitude,
    destLat: trip.destinationLatitude, destLng: trip.destinationLongitude,
    isDark,
  });

  const visiblePassengers = trip.passengers.filter(p => p.bookingState !== 'cancelled');

  return (
    <View style={[styles.container, { backgroundColor: colors.screenBg, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.stateBadge, { backgroundColor: b.stateColor + '22' }]}>
          <View style={[styles.stateDot, { backgroundColor: b.stateColor }]} />
          <Text style={[styles.stateText, { color: b.stateColor }]}>{b.stateLabel}</Text>
        </View>
        <Pressable
          style={[styles.cancelBtn, { borderColor: colors.border }]}
          onPress={() => b.setShowCancel(true)}
        >
          <Ionicons name="close-circle-outline" size={16} color="#e53e3e" />
          <Text style={styles.cancelBtnText}>Cancelar</Text>
        </Pressable>
      </View>

      {/* Route text card — boarding only */}
      {b.isBoarding && (
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
      {b.isBoarding && (
        <Pressable
          style={[styles.scanBtn, { marginHorizontal: 16, marginBottom: 10 }, b.scanning && { opacity: 0.6 }]}
          onPress={() => b.setScannerOpen(true)}
          disabled={b.scanning}
        >
          {b.scanning
            ? <ActivityIndicator color="#fff" size="small" />
            : <Ionicons name="qr-code-outline" size={20} color="#fff" />
          }
          <Text style={styles.scanBtnText}>{b.scanning ? 'Procesando…' : 'Escanear QR de pasajero'}</Text>
        </Pressable>
      )}

      {/* Map + navigation — in_progress only */}
      {b.isInProgress && (
        <BoardingMap trip={trip} mapUrl={mapUrl} mapError={mapError} onMapError={onMapError} colors={colors} />
      )}

      {/* Passengers */}
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
        Pasajeros — {b.boardedPassengers.length}/{b.totalActive.length} abordados
      </Text>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 8, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {visiblePassengers.length === 0 ? (
          <View style={[styles.graceCard, { backgroundColor: colors.inputBg }]}>
            <Ionicons name="people-outline" size={16} color={colors.textMuted} />
            <Text style={[styles.graceText, { color: colors.textSecondary }]}>
              Sin pasajeros reservados. Escanea su QR cuando suban.
            </Text>
          </View>
        ) : (
          visiblePassengers.map(p => (
            <PassengerRow
              key={p.bookingId}
              passenger={p}
              isBoarding={b.isBoarding}
              graceElapsed={b.graceLeft === 0}
              onMarkNoShow={() => b.handleNoShow(p.bookingId, `${p.firstName} ${p.lastName}`)}
              colors={colors}
            />
          ))
        )}

        {b.isBoarding && b.graceMinSec && b.pendingPassengers.length > 0 && (
          <View style={[styles.graceCard, { backgroundColor: '#f4a52218' }]}>
            <Ionicons name="timer-outline" size={16} color="#f4a522" />
            <Text style={styles.graceText}>
              Período de gracia: <Text style={{ fontFamily: Fonts.headingBold }}>{b.graceMinSec}</Text> restante
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Primary action */}
      {b.isBoarding && (
        <SlideToAction
          label={b.allBoarded ? 'Iniciar viaje' : `Iniciar viaje (${b.pendingPassengers.length} pendiente${b.pendingPassengers.length > 1 ? 's' : ''})`}
          onSlide={b.allBoarded ? b.handleStartJourney : undefined}
          disabled={!b.allBoarded || b.submitting}
          color={Brand.colors.green.normal}
          insets={insets}
        />
      )}
      {b.isInProgress && (
        <SlideToAction
          label="Finalizar viaje"
          onSlide={b.handleCompleteTrip}
          disabled={b.submitting}
          color="#2d6a4f"
          insets={insets}
        />
      )}

      {/* Modals */}
      <QrScanner visible={b.scannerOpen} onScan={b.handleScan} onClose={() => b.setScannerOpen(false)} />

      <GlassAlert
        visible={!!b.scanFeedback}
        icon={b.scanFeedback?.boarded ? 'checkmark-circle' : 'information-circle'}
        iconColor={b.scanFeedback?.boarded ? Brand.colors.green.normal : '#f4a522'}
        title={b.scanFeedback?.boarded ? '¡Pasajero abordado!' : 'Ya estaba registrado'}
        body={b.scanFeedback ? `${b.scanFeedback.name} ${b.scanFeedback.boarded ? 'está ahora en el vehículo.' : 'ya había sido registrado anteriormente.'}` : ''}
        primaryLabel="Listo"
        onDismiss={() => b.setScanFeedback(null)}
      />

      <GlassAlert
        visible={b.showSeatbelt}
        icon="shield-checkmark"
        iconColor={Brand.colors.green.normal}
        title="Recuerden el cinturón"
        body="Antes de arrancar, asegúrate de que todos los pasajeros lleven el cinturón de seguridad puesto."
        primaryLabel="Todos listos"
        onDismiss={() => b.setShowSeatbelt(false)}
      />

      {/* No-show confirmation */}
      <GlassAlert
        visible={!!b.noShowConfirm}
        icon="person-remove"
        iconColor="#e53e3e"
        title={b.noShowConfirm ? `¿Marcar a ${b.noShowConfirm.name}?` : ''}
        body={b.graceLeft > 0
          ? `Quedan ${b.graceMinSec} de período de gracia.`
          : 'El período de gracia ha finalizado. El pasajero no se presentó.'}
        primaryLabel="Sí, no se presentó"
        onPrimary={b.confirmNoShow}
        secondaryLabel="Cancelar"
        onSecondary={() => b.setNoShowConfirm(null)}
        dismissible={false}
        onDismiss={() => b.setNoShowConfirm(null)}
      />

      {/* Generic error */}
      <GlassAlert
        visible={!!b.errorMsg}
        icon="alert-circle"
        iconColor="#e53e3e"
        title={b.errorMsg?.title ?? 'Error'}
        body={b.errorMsg?.body ?? ''}
        primaryLabel="Entendido"
        onDismiss={() => b.setErrorMsg(null)}
      />

      <CancellationModal
        visible={b.showCancel}
        type="driver"
        title="¿Por qué cancelas el viaje?"
        onConfirm={b.handleCancelTrip}
        onCancel={() => b.setShowCancel(false)}
        loading={b.submitting}
      />

      <RatingModal
        visible={b.showRating && b.boardedPassengers.length > 0}
        ratedUser={b.boardedPassengers[b.currentRatingIdx] ? {
          id: b.boardedPassengers[b.currentRatingIdx].passengerId,
          name: `${b.boardedPassengers[b.currentRatingIdx].firstName} ${b.boardedPassengers[b.currentRatingIdx].lastName}`,
          role: 'passenger',
        } : null}
        onSubmit={b.handleRatingSubmit}
        onSkip={b.skipRating}
      />

      {/* Payment confirmation step after ratings */}
      {b.showPayments && (
        <PaymentConfirmationStep
          colors={colors}
          insets={insets}
          loadingPayments={b.loadingPayments}
          pendingPayments={b.pendingPayments}
          confirmingId={b.confirmingId}
          onConfirmPayment={b.handleConfirmPayment}
          onFinish={onTripEnded}
        />
      )}
    </View>
  );
}
