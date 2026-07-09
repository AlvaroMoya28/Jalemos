import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';

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
  const [paymentError, setPaymentError]         = useState<string | null>(null);
  const [retryTick, setRetryTick]               = useState(0);
  const paymentCreatedFor                       = useRef<string | null>(null);
  const methodsLoadedFor                        = useRef<string | null>(null);

  // Load payment methods + pre-select favorite for any active or completed trip.
  // Keyed by tripId (not by whether state is already populated) so each new trip
  // re-syncs to the passenger's CURRENT favorite instead of reusing whatever method
  // was selected on a previous trip.
  useEffect(() => {
    if (!token || !passengerTrip) return;
    const s = passengerTrip.tripState;
    if (s !== 'boarding' && s !== 'in_progress' && s !== 'completed') return;
    if (methodsLoadedFor.current === passengerTrip.tripId) return;
    methodsLoadedFor.current = passengerTrip.tripId;
    paymentsApi.getMethods(token).then(methods => {
      setPaymentMethods(methods);
      const fav = methods.find(m => m.isFavorite) ?? methods[0] ?? null;
      setSelectedMethod(fav);
    }).catch(() => { methodsLoadedFor.current = null; });
  }, [token, passengerTrip?.tripId, passengerTrip?.tripState]);

  // Auto-create payment when trip completes.
  useEffect(() => {
    if (!token || !passengerTrip || passengerTrip.tripState !== 'completed') return;
    if (paymentCreatedFor.current === passengerTrip.bookingId) return;
    if (!selectedMethod) return;

    paymentCreatedFor.current = passengerTrip.bookingId;
    setPaymentCreating(true);
    setPaymentError(null);
    // Check for a payment that already exists for this booking first — e.g. the app was
    // closed and reopened after the payment was already created (and possibly confirmed).
    // Without this check we'd create a duplicate payment every time the app remounts.
    paymentsApi.getByBooking(passengerTrip.bookingId, token)
      .then(setPayment)
      .catch(() =>
        paymentsApi.createPayment({
          bookingId: passengerTrip.bookingId,
          amount: passengerTrip.rate,
          method: selectedMethod.type,
          paymentMethodId: selectedMethod.type === 'card' ? selectedMethod.id : undefined,
        }, token)
          .then(setPayment)
          .catch((e: any) => {
            // Reset so retryPayment (or a future deps change) can try again — otherwise
            // this fails silently forever with an empty payment card.
            paymentCreatedFor.current = null;
            setPaymentError(e.message ?? 'No se pudo procesar el pago.');
          }),
      )
      .finally(() => setPaymentCreating(false));
  }, [passengerTrip?.tripState, passengerTrip?.bookingId, token, selectedMethod, retryTick]);

  const retryPayment = () => {
    paymentCreatedFor.current = null;
    setPaymentError(null);
    setRetryTick(t => t + 1);
  };

  // Alert when payment fails — offer to retry with another method.
  useEffect(() => {
    if (!payment || payment.status !== 'failed') return;
    Alert.alert(
      'Pago fallido',
      'No se pudo procesar el pago con este método. ¿Querés intentar con otro?',
      [
        {
          text: 'Cambiar método',
          onPress: () => {
            // Reset so the creation effect can fire again with the new method.
            setPayment(null);
            paymentCreatedFor.current = null;
            setShowMethodPicker(true);
          },
        },
        { text: 'Cerrar', style: 'cancel' },
      ],
    );
  }, [payment?.status, payment]);

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
    payment, paymentCreating, paymentError, retryPayment,
  };
}
