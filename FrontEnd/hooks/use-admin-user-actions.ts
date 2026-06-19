// Admin user mutations (change role / suspend / reactivate …) wrapped with
// confirmation alerts and a shared loading flag. Extracted from the
// admin-users screen so the moderation logic is isolated and testable.

import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { AdminUser, UserRole, useAdminUsers } from '@/contexts/admin-users';

export function useAdminUserActions() {
  const { changeRole, ban, liftBan, deactivate, activate } = useAdminUsers();
  const [actionLoading, setActionLoading] = useState(false);

  const handleAction = useCallback(async (fn: () => Promise<void>, successMsg: string) => {
    setActionLoading(true);
    try {
      await fn();
      Alert.alert('Listo', successMsg);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Ocurrió un error');
    } finally {
      setActionLoading(false);
    }
  }, []);

  const handleChangeRole = useCallback((user: AdminUser, role: UserRole) => {
    const label = role === 'admin' ? 'administrador' : role === 'driver' ? 'conductor' : 'pasajero';
    Alert.alert(
      'Cambiar rol',
      `¿Cambiar el rol de ${user.firstName} a ${label}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: () => handleAction(() => changeRole(user.id, role), 'Rol actualizado'),
        },
      ],
    );
  }, [changeRole, handleAction]);

  const handleBan = useCallback((user: AdminUser, days: number) => {
    const desc = days === 0 ? 'permanentemente' : `por ${days} día${days > 1 ? 's' : ''}`;
    Alert.alert(
      'Suspender usuario',
      `¿Suspender a ${user.firstName} ${desc}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Suspender',
          style: 'destructive',
          onPress: () => handleAction(() => ban(user.id, days), 'Usuario suspendido'),
        },
      ],
    );
  }, [ban, handleAction]);

  const handleLiftBan = useCallback((user: AdminUser) => {
    handleAction(() => liftBan(user.id), 'Suspensión levantada');
  }, [liftBan, handleAction]);

  const handleDeactivate = useCallback((user: AdminUser) => {
    Alert.alert(
      'Desactivar cuenta',
      `¿Desactivar la cuenta de ${user.firstName}? No podrá iniciar sesión.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desactivar',
          style: 'destructive',
          onPress: () => handleAction(() => deactivate(user.id), 'Cuenta desactivada'),
        },
      ],
    );
  }, [deactivate, handleAction]);

  const handleActivate = useCallback((user: AdminUser) => {
    handleAction(() => activate(user.id), 'Cuenta reactivada');
  }, [activate, handleAction]);

  return {
    actionLoading,
    handleChangeRole,
    handleBan,
    handleLiftBan,
    handleDeactivate,
    handleActivate,
  };
}
