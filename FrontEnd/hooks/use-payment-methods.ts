// Passenger payment-methods state + actions (E0-6 extraction): load, add SINPE/cash,
// delete, and set-favorite. Loads on focus while a token is present. Kept out of the
// profile screen so the screen stays a thin container.

import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Alert } from 'react-native';

import { PaymentMethodDto, paymentsApi } from '@/services/api';

export function usePaymentMethods(token: string | null) {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodDto[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(false);
  const [showAddMethod, setShowAddMethod] = useState(false);
  const [addMethodType, setAddMethodType] = useState<'sinpe' | 'cash' | 'card' | null>(null);
  const [newAlias, setNewAlias] = useState('');
  const [addingMethod, setAddingMethod] = useState(false);
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

  const handleDeleteMethod = async (id: string) => {
    if (!token) return;
    setDeletingMethodId(id);
    try {
      await paymentsApi.deleteMethod(id, token);
      setPaymentMethods((prev) => {
        const remaining = prev.filter((m) => m.id !== id);
        // If a single method is left, it becomes the favorite by default.
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
    addingMethod, deletingMethodId, togglingFavId,
    handleAddSimpleMethod, handleDeleteMethod, handleSetFavorite,
  };
}
