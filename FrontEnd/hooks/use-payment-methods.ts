import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Alert } from 'react-native';

import { PaymentMethodDto, paymentsApi } from '@/services/api';
import { parseExpiry } from '@/components/shared/expiry-input';

export function usePaymentMethods(token: string | null) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodDto[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(false);
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [addMethodType, setAddMethodType] = useState<'sinpe' | 'cash' | 'card' | null>(null);

  // Simple method fields (sinpe / cash)
  const [newAlias, setNewAlias] = useState('');
  const [addingMethod, setAddingMethod] = useState(false);

  // Card form fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');

  const [deletingMethodId, setDeletingMethodId] = useState<string | null>(null);
  const [togglingFavId, setTogglingFavId] = useState<string | null>(null);

  const loadPaymentMethods = useCallback(() => {
    if (!token) return;
    setMethodsLoading(true);
    paymentsApi.getMethods(token)
      .then(setPaymentMethods)
      .catch(() => {})
      .finally(() => setMethodsLoading(false));
  }, [token]);

  useFocusEffect(useCallback(() => { loadPaymentMethods(); }, [loadPaymentMethods]));

  const resetCardForm = () => {
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCardholderName('');
  };

  const handleAddSimpleMethod = async () => {
    if (!token || !addMethodType || addMethodType === 'card') return;
    const alias = newAlias.trim() || (addMethodType === 'sinpe' ? 'SINPE Móvil' : 'Efectivo');
    setAddingMethod(true);
    try {
      const created = await paymentsApi.addSimple(addMethodType, alias, token);
      setPaymentMethods((prev) => [...prev, created]);
      setShowAddMethod(false);
      setAddMethodType(null);
      setNewAlias('');
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo agregar el método.');
    } finally {
      setAddingMethod(false);
    }
  };

  const handleAddCard = async () => {
    if (!token) return;

    const digits = cardNumber.replace(/\s/g, '');
    if (digits.length < 13 || digits.length > 19) {
      Alert.alert('Error', 'Número de tarjeta inválido.');
      return;
    }
    if (!cardholderName.trim()) {
      Alert.alert('Error', 'Ingresa el nombre del titular.');
      return;
    }
    const { month, year } = parseExpiry(cardExpiry);
    if (!month || !year) {
      Alert.alert('Error', 'Fecha de vencimiento inválida (MM/AA).');
      return;
    }
    if (!/^\d{3,4}$/.test(cardCvv.trim())) {
      Alert.alert('Error', 'CVV inválido.');
      return;
    }

    setAddingMethod(true);
    try {
      const created = await paymentsApi.addCard(
        { cardNumber: digits, expiryMonth: month, expiryYear: year, cardholderName: cardholderName.trim() },
        token,
      );
      setPaymentMethods((prev) => [...prev, created]);
      setShowAddMethod(false);
      setAddMethodType(null);
      resetCardForm();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo agregar la tarjeta.');
    } finally {
      setAddingMethod(false);
    }
  };

  const handleDeleteMethod = async (id: string) => {
    if (!token) return;
    setDeletingMethodId(id);
    try {
      await paymentsApi.deleteMethod(id, token);
      setPaymentMethods((prev) => {
        const remaining = prev.filter((m) => m.id !== id);
        if (remaining.length === 1 && !remaining[0].isFavorite) return [{ ...remaining[0], isFavorite: true }];
        return remaining;
      });
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo eliminar el método.');
    } finally {
      setDeletingMethodId(null);
    }
  };

  const handleSetFavorite = async (id: string) => {
    if (!token) return;
    setTogglingFavId(id);
    try {
      await paymentsApi.setFavorite(id, token);
      setPaymentMethods((prev) => prev.map((m) => ({ ...m, isFavorite: m.id === id })));
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo actualizar.');
    } finally {
      setTogglingFavId(null);
    }
  };

  return {
    paymentMethods, methodsLoading,
    showAddMethod, setShowAddMethod,
    addMethodType, setAddMethodType,
    newAlias, setNewAlias,
    cardNumber, setCardNumber,
    cardExpiry, setCardExpiry,
    cardCvv, setCardCvv,
    cardholderName, setCardholderName,
    addingMethod, deletingMethodId, togglingFavId,
    handleAddSimpleMethod, handleAddCard, handleDeleteMethod, handleSetFavorite,
  };
}
