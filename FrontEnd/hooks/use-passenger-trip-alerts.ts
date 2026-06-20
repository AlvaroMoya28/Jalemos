// One-time, persisted passenger alerts for the active trip: seatbelt prompt,
// "you've boarded" notice, cancellation notice (with late-cancel rating), and
// the post-trip rating prompt. Acknowledged trip IDs are stored in SecureStore
// so the alerts don't reappear after re-login. Extracted from the trip bubble.

import * as SecureStore from 'expo-secure-store';
import { useEffect, useRef, useState } from 'react';

import { ActivePassengerTrip } from '@/services/api';

export interface LateCancelDriver {
  id: string;
  name: string;
  tripId: string;
}

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

export function buildCancelBody(trip: {
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

export function usePassengerTripAlerts(
  passengerTrip: ActivePassengerTrip | null,
  onBoarded: () => void,
) {
  const [showSeatbelt, setShowSeatbelt]                 = useState(false);
  const [showRating, setShowRating]                     = useState(false);
  const [showLateCancelRating, setShowLateCancelRating] = useState(false);
  const [showCancelledAlert, setShowCancelledAlert]     = useState(false);
  const [showBoardedAlert, setShowBoardedAlert]         = useState(false);
  const [cancelAlertBody, setCancelAlertBody]           = useState('Tu viaje fue cancelado.');
  const [lateCancelDriver, setLateCancelDriver]         = useState<LateCancelDriver | null>(null);

  // Latest onBoarded callback, read via ref so the boarded-transition effect can
  // depend only on bookingState (not re-run when the inline callback changes).
  const onBoardedRef = useRef(onBoarded);
  onBoardedRef.current = onBoarded;

  // Previous booking state — used to detect the confirmed → boarded transition
  const prevBookingState = useRef<string | null>(null);
  const seatbeltShown      = useRef(false);
  const shownCancelFor     = useRef<string | null>(null);
  const shownRatingFor     = useRef<string | null>(null);
  const shownLateCancelFor = useRef<string | null>(null);
  // Tracks whether the persisted cancel-ack has been loaded from storage
  const [cancelAckLoaded, setCancelAckLoaded] = useState(false);

  // Load previously acknowledged trip IDs from storage on mount.
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

  // Seatbelt alert when journey starts
  useEffect(() => {
    if (passengerTrip?.tripState === 'in_progress' && !seatbeltShown.current) {
      seatbeltShown.current = true;
      setShowSeatbelt(true);
    }
  }, [passengerTrip?.tripState]);

  // Reset per-trip one-time flags whenever the active trip changes
  useEffect(() => {
    seatbeltShown.current  = false;
    prevBookingState.current = null;
  }, [passengerTrip?.tripId]);

  // Detect the confirmed → boarded transition (driver scanned the QR).
  useEffect(() => {
    const current = passengerTrip?.bookingState ?? null;
    if (current === 'boarded') {
      onBoardedRef.current();
      if (prevBookingState.current && prevBookingState.current !== 'boarded') {
        setShowBoardedAlert(true);
      }
    }
    prevBookingState.current = current;
  }, [passengerTrip?.bookingState]);

  // Cancelled alert — show once per trip, persisted across sessions.
  // Also caches driver info if it's a late cancellation so the rating can be shown
  // even after passengerTrip becomes null (15-min API window expires).
  useEffect(() => {
    if (!cancelAckLoaded) return;
    if (passengerTrip?.tripState === 'cancelled' && passengerTrip.tripId !== shownCancelFor.current) {
      const cancelledAt = passengerTrip.cancelledAt ? new Date(passengerTrip.cancelledAt).getTime() : null;
      const isFresh = cancelledAt ? (Date.now() - cancelledAt) < 30 * 60_000 : false;
      if (!isFresh) return;

      shownCancelFor.current = passengerTrip.tripId;
      SecureStore.setItemAsync('jalemos_cancel_ack', passengerTrip.tripId).catch(() => {});

      setCancelAlertBody(buildCancelBody(passengerTrip));

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
  }, [passengerTrip?.tripState, passengerTrip?.tripId, passengerTrip?.cancelledAt, cancelAckLoaded, passengerTrip]);

  // Rating prompt after trip completed (once per trip, persisted across sessions)
  useEffect(() => {
    if (!cancelAckLoaded) return;
    if (passengerTrip?.tripState === 'completed' && passengerTrip.tripId !== shownRatingFor.current) {
      shownRatingFor.current = passengerTrip.tripId;
      SecureStore.setItemAsync('jalemos_rating_ack', passengerTrip.tripId).catch(() => {});
      setShowRating(true);
    }
  }, [passengerTrip?.tripState, passengerTrip?.tripId, cancelAckLoaded]);

  const markRatingShown = (tripId: string) => { shownRatingFor.current = tripId; };

  return {
    showSeatbelt, setShowSeatbelt,
    showRating, setShowRating,
    showLateCancelRating, setShowLateCancelRating,
    showCancelledAlert, setShowCancelledAlert,
    showBoardedAlert, setShowBoardedAlert,
    cancelAlertBody,
    lateCancelDriver, setLateCancelDriver,
    markRatingShown,
  };
}
