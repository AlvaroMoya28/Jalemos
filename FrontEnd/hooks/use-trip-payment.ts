// Passenger-side payment lifecycle for the active trip: loads payment methods,
// auto-creates the payment when the trip completes, and polls until it's
// confirmed. Extracted from the active-trip bubble.

import { useEffect, useRef, useState } from 'react';

import { PaymentDto, PaymentMethodDto, paymentsApi } from '@/services/api';

interface ActiveTripLike {
  tripId: string;
  tripState: string;
  bookingId: string;
  rate: number;
}

export function useTripPayment(passengerTrip: ActiveTripLike | null, token: string | null) {
  const [paymentMethods, setPaymentMethods]     = useState<PaymentMethodDto[]>([]);
  const [selectedMethod, setSelectedMethod]     = useState<PaymentMethodDto | null>(null);
  const [showMethodPicker, setShowMethodPicker] = useState(false);
  const [payment, setPayment]                   = useState<PaymentDto | null>(null);
  const [paymentCreating, setPaymentCreating]   = useState(false);
  const paymentCreatedFor                       = useRef<string | null>(null);

  // Load payment methods + pre-select favorite for any active or completed trip.
  // Runs on boarding/in_progress/completed so a fresh app open during any of those
  // states still has a selectedMethod ready when the payment needs to be created.
  useEffect(() => {
    if (!token || !passengerTrip) return;
    const s = passengerTrip.tripState;
    if (s !== 'boarding' && s !== 'in_progress' && s !== 'completed') return;
    if (paymentMethods.length > 0 && selectedMethod) return; // already loaded
    paymentsApi.getMethods(token).then(methods => {
      setPaymentMethods(methods);
      if (!selectedMethod && methods.length > 0) {
        const fav = methods.find(m => m.isFavorite) ?? methods[0];
        setSelectedMethod(fav);
      }
    }).catch(() => {});
  }, [token, passengerTrip?.tripId, passengerTrip?.tripState]);

  // Auto-create payment when trip completes.
  // Depends on selectedMethod so it re-runs once the method finishes loading
  // (handles the case where the app was opened fresh during a completed trip).
  useEffect(() => {
    if (!token || !passengerTrip || passengerTrip.tripState !== 'completed') return;
    if (paymentCreatedFor.current === passengerTrip.bookingId) return;
    if (!selectedMethod) return; // wait for the methods-load effect above to set this

    paymentCreatedFor.current = passengerTrip.bookingId;
    setPaymentCreating(true);
    paymentsApi.createPayment({
      bookingId: passengerTrip.bookingId,
      amount: passengerTrip.rate,
      method: selectedMethod.type,
      paymentMethodId: selectedMethod.type === 'card' ? selectedMethod.id : undefined,
    }, token)
      .then(setPayment)
      .catch(() => { paymentCreatedFor.current = null; })
      .finally(() => setPaymentCreating(false));
  }, [passengerTrip?.tripState, passengerTrip?.bookingId, token, selectedMethod]);

  // Poll payment status while pending so the passenger sees 'confirmed' when the driver confirms.
  useEffect(() => {
    if (!token || !payment || payment.status !== 'pending') return;
    const id = setInterval(async () => {
      try {
        const updated = await paymentsApi.getByBooking(payment.bookingId, token);
        if (updated.status !== 'pending') {
          setPayment(updated);
          clearInterval(id);
        }
      } catch {}
    }, 5_000);
    return () => clearInterval(id);
  }, [token, payment?.id, payment?.status]);

  return {
    paymentMethods,
    selectedMethod, setSelectedMethod,
    showMethodPicker, setShowMethodPicker,
    payment, paymentCreating,
  };
}
