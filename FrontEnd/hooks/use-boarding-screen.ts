// State machine + actions for the driver boarding screen: QR scanning, no-show
// marking, journey start, trip completion/cancellation, per-passenger rating
// flow and post-trip payment confirmation. Extracted so the trip-lifecycle
// logic is isolated and testable; the screen consumes this and renders.

import { useCallback, useEffect, useRef, useState } from 'react';

import { useActiveTrip } from '@/contexts/active-trip';
import { useAuth } from '@/contexts/auth';
import { Brand } from '@/constants/theme';
import { TripStatusResponse, paymentsApi, ratingsApi, tripLifecycleApi } from '@/services/api';

export interface TripSummaryRow {
  bookingId: string;
  paymentId: string | null;
  passengerName: string;
  amount: number | null;
  method: string | null;
  status: 'confirmed' | 'failed' | 'pending' | 'unverified';
}

export function useBoardingScreen(
  trip: TripStatusResponse,
  onTripEnded: () => void,
  onTripCompleted?: (trip: TripStatusResponse) => void,
) {
  const { token }   = useAuth();
  const { refresh } = useActiveTrip();

  const [scannerOpen, setScannerOpen]           = useState(false);
  const [scanFeedback, setScanFeedback]         = useState<{ name: string; boarded: boolean } | null>(null);
  const [scanning, setScanning]                 = useState(false);
  const [showCancel, setShowCancel]             = useState(false);
  const [showSeatbelt, setShowSeatbelt]         = useState(false);
  const [showRating, setShowRating]             = useState(false);
  const [currentRatingIdx, setCurrentRatingIdx] = useState(0);
  const [submitting, setSubmitting]             = useState(false);
  const seatbeltShown                           = useRef(false);
  const [noShowConfirm, setNoShowConfirm]       = useState<{ bookingId: string; name: string } | null>(null);
  const [errorMsg, setErrorMsg]                 = useState<{ title: string; body: string } | null>(null);

  // Combined payment-confirmation + trip-finished summary (shown after rating, right
  // before the driver leaves the trip screen). One screen for every payment mix —
  // already-resolved payments (card) just show their status, SINPE/cash payments still
  // pending get an inline confirm action, and everything ends with one Finalizar/Aceptar.
  const [showPaymentSummary, setShowPaymentSummary] = useState(false);
  const [loadingSummary, setLoadingSummary]         = useState(false);
  const [summaryRows, setSummaryRows]               = useState<TripSummaryRow[]>([]);
  const [confirmingId, setConfirmingId]             = useState<string | null>(null);

  const boardedPassengers = trip.passengers.filter(p => p.bookingState === 'boarded');
  const pendingPassengers = trip.passengers.filter(p => p.bookingState === 'confirmed' || p.bookingState === 'pending');
  const totalActive       = trip.passengers.filter(p => !['cancelled', 'no_show'].includes(p.bookingState));
  const allBoarded        = pendingPassengers.length === 0;

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

  const loadPaymentSummary = async () => {
    if (!token) { onTripEnded(); return; }
    setLoadingSummary(true);
    setShowPaymentSummary(true);
    try {
      // The passenger's app creates the payment when it polls and detects the trip
      // as completed. That poll may take a few seconds after the driver ends the trip,
      // so we retry up to ~12 s before giving up on any passenger still unverified.
      const DEADLINE = Date.now() + 12_000;
      let rows: TripSummaryRow[] = [];

      do {
        rows = [];
        for (const p of boardedPassengers) {
          const name = `${p.firstName} ${p.lastName}`;
          try {
            const pay = await paymentsApi.getByBooking(p.bookingId, token);
            rows.push({ bookingId: p.bookingId, paymentId: pay.id, passengerName: name, amount: pay.amount, method: pay.method, status: pay.status });
          } catch {
            rows.push({ bookingId: p.bookingId, paymentId: null, passengerName: name, amount: null, method: null, status: 'unverified' });
          }
        }
        if (!rows.some(r => r.status === 'unverified') || Date.now() >= DEADLINE) break;
        await new Promise(r => setTimeout(r, 3_000));
      } while (true);

      setSummaryRows(rows);
    } catch {
      setSummaryRows(boardedPassengers.map(p => ({
        bookingId: p.bookingId, paymentId: null, passengerName: `${p.firstName} ${p.lastName}`, amount: null, method: null, status: 'unverified',
      })));
    } finally {
      setLoadingSummary(false);
    }
  };

  const dismissPaymentSummary = () => {
    setShowPaymentSummary(false);
    onTripEnded();
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
      loadPaymentSummary();
    }
  };

  const skipRating = () => {
    const next = currentRatingIdx + 1;
    if (next < boardedPassengers.length) setCurrentRatingIdx(next);
    else { setShowRating(false); loadPaymentSummary(); }
  };

  const handleConfirmPayment = async (paymentId: string) => {
    if (!token) return;
    setConfirmingId(paymentId);
    try {
      await paymentsApi.confirmPayment(paymentId, token);
      setSummaryRows(prev => prev.map(r => r.paymentId === paymentId ? { ...r, status: 'confirmed' } : r));
    } catch (e: any) {
      setErrorMsg({ title: 'Error', body: e.message ?? 'No se pudo confirmar el pago.' });
    } finally {
      setConfirmingId(null);
    }
  };

  const stateColor = isBoarding ? '#f4a522' : isInProgress ? Brand.colors.green.normal : '#aaa';
  const stateLabel = isBoarding ? 'Abordaje en curso' : isInProgress ? 'Viaje en curso' : 'Completado';

  return {
    // status
    isBoarding, isInProgress, stateColor, stateLabel,
    boardedPassengers, pendingPassengers, totalActive, allBoarded,
    graceLeft, graceMinSec,
    // scanning
    scannerOpen, setScannerOpen, scanFeedback, setScanFeedback, scanning, handleScan,
    // no-show
    noShowConfirm, setNoShowConfirm, handleNoShow, confirmNoShow,
    // lifecycle
    submitting, handleStartJourney, handleCompleteTrip,
    showCancel, setShowCancel, handleCancelTrip,
    showSeatbelt, setShowSeatbelt,
    errorMsg, setErrorMsg,
    // rating
    showRating, currentRatingIdx, handleRatingSubmit, skipRating,
    // payments
    showPaymentSummary, loadingSummary, summaryRows, confirmingId, handleConfirmPayment,
    dismissPaymentSummary,
  };
}
