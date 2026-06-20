// Alert + rating + cancellation + emergency modals for the passenger trip bubble.
// Pure presentation driven by the alerts hook and the bubble's local handlers.

import { Brand } from '@/constants/theme';
import { usePassengerTripAlerts } from '@/hooks/use-passenger-trip-alerts';
import { ActivePassengerTrip } from '@/services/api';
import CancellationModal from '../shared/cancellation-modal';
import EmergencyReportModal from '../shared/emergency-report-modal';
import GlassAlert from '../shared/glass-alert';
import RatingModal from '../shared/rating-modal';

export default function PassengerTripModals({
  trip,
  alerts,
  onSubmitRating,
  submittingRating,
  showCancel,
  onCancelClose,
  onConfirmCancel,
  showEmergencyReport,
  onEmergencyDismiss,
}: {
  trip: ActivePassengerTrip | null;
  alerts: ReturnType<typeof usePassengerTripAlerts>;
  onSubmitRating: (score: number, comment: string | null) => void;
  submittingRating: boolean;
  showCancel: boolean;
  onCancelClose: () => void;
  onConfirmCancel: (reason: string, details: string | null) => void;
  showEmergencyReport: boolean;
  onEmergencyDismiss: () => void;
}) {
  return (
    <>
      <GlassAlert
        visible={alerts.showBoardedAlert}
        icon="checkmark-circle"
        iconColor={Brand.colors.green.normal}
        title="¡Has abordado!"
        body="El conductor escaneó tu código. Ya estás registrado en el vehículo, espera a que inicie el viaje."
        primaryLabel="Entendido"
        onDismiss={() => alerts.setShowBoardedAlert(false)}
      />

      <GlassAlert
        visible={alerts.showSeatbelt}
        icon="shield-checkmark"
        iconColor={Brand.colors.green.normal}
        title="¡Abróchate el cinturón!"
        body="Por tu seguridad y la de todos, asegúrate de tener el cinturón de seguridad bien puesto antes de que el viaje comience."
        primaryLabel="Listo, estoy seguro"
        onDismiss={() => alerts.setShowSeatbelt(false)}
      />

      <GlassAlert
        visible={alerts.showCancelledAlert}
        icon="close-circle"
        iconColor="#e53e3e"
        title="Viaje cancelado"
        body={alerts.cancelAlertBody}
        primaryLabel="Entendido"
        onDismiss={() => {
          alerts.setShowCancelledAlert(false);
          // Show rating prompt AFTER the cancel alert closes (avoids two Modals at once)
          if (alerts.lateCancelDriver) setTimeout(() => alerts.setShowLateCancelRating(true), 350);
        }}
      />

      {/* Rating after completed trip */}
      {trip && (
        <RatingModal
          visible={alerts.showRating}
          ratedUser={{
            id:   trip.driverId,
            name: `${trip.driverFirstName} ${trip.driverLastName}`,
            role: 'driver',
          }}
          onSubmit={onSubmitRating}
          onSkip={() => { alerts.setShowRating(false); alerts.markRatingShown(trip.tripId); }}
          loading={submittingRating}
        />
      )}

      {/* Rating after late cancellation — uses cached driver info, not trip */}
      {alerts.lateCancelDriver && (
        <RatingModal
          visible={alerts.showLateCancelRating && !alerts.showRating}
          ratedUser={{ id: alerts.lateCancelDriver.id, name: alerts.lateCancelDriver.name, role: 'driver' }}
          onSubmit={onSubmitRating}
          onSkip={() => { alerts.setShowLateCancelRating(false); alerts.setLateCancelDriver(null); }}
          loading={submittingRating}
        />
      )}

      {/* Cancel booking */}
      <CancellationModal
        visible={showCancel}
        type="passenger"
        title="¿Por qué cancelas tu reserva?"
        onConfirm={onConfirmCancel}
        onCancel={onCancelClose}
      />

      {/* Emergency / driver report (E3-2) */}
      {trip && (
        <EmergencyReportModal
          visible={showEmergencyReport}
          tripId={trip.tripId}
          onDismiss={onEmergencyDismiss}
        />
      )}
    </>
  );
}
