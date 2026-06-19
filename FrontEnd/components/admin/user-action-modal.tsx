// Bottom-sheet of admin actions for a selected user. The available actions
// depend on the user's current role and account status.

import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { AdminUser, UserRole } from '@/contexts/admin-users';
import { useAppTheme } from '@/hooks/use-app-theme';
import { makeStyles } from '@/styles/tabs/admin-users.styles';

interface ActionItem {
  label: string;
  icon:  string;
  color: string;
  onPress: () => void;
}

export default function UserActionModal({
  user,
  visible,
  onClose,
  styles,
  colors,
  isDark,
  onChangeRole,
  onBan,
  onLiftBan,
  onDeactivate,
  onActivate,
}: {
  user: AdminUser | null;
  visible: boolean;
  onClose: () => void;
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useAppTheme>['colors'];
  isDark: boolean;
  onChangeRole: (role: UserRole) => void;
  onBan: (days: number) => void;
  onLiftBan: () => void;
  onDeactivate: () => void;
  onActivate: () => void;
}) {
  if (!user) return null;

  const isSuspended   = user.displayStatus === 'suspended';
  const isDeactivated = user.displayStatus === 'deactivated';
  const isActive      = user.displayStatus === 'active';

  const actions: ActionItem[] = [];

  // Role actions
  if (user.role !== 'admin') {
    actions.push({
      label: 'Hacer administrador',
      icon:  'shield-checkmark-outline',
      color: '#9b59b6',
      onPress: () => { onClose(); onChangeRole('admin'); },
    });
  } else {
    actions.push({
      label: 'Quitar rol administrador',
      icon:  'shield-outline',
      color: colors.textSecondary,
      onPress: () => { onClose(); onChangeRole('passenger'); },
    });
  }

  if (user.role === 'driver') {
    actions.push({
      label: 'Retirar rol conductor',
      icon:  'car-outline',
      color: '#f7a900',
      onPress: () => { onClose(); onChangeRole('passenger'); },
    });
  }

  // Suspension actions
  if (isSuspended) {
    actions.push({
      label: 'Levantar suspensión',
      icon:  'checkmark-circle-outline',
      color: Brand.colors.green.normal,
      onPress: () => { onClose(); onLiftBan(); },
    });
  }

  if (isActive || isSuspended) {
    actions.push(
      { label: 'Suspender 1 día',     icon: 'time-outline', color: '#f7a900', onPress: () => { onClose(); onBan(1); } },
      { label: 'Suspender 7 días',    icon: 'time-outline', color: '#f7a900', onPress: () => { onClose(); onBan(7); } },
      { label: 'Suspender 30 días',   icon: 'time-outline', color: '#f7a900', onPress: () => { onClose(); onBan(30); } },
      { label: 'Suspender permanente',icon: 'ban-outline',  color: Brand.colors.alerts.error, onPress: () => { onClose(); onBan(0); } },
    );
  }

  // Activation / deactivation
  if (isDeactivated) {
    actions.push({
      label: 'Reactivar cuenta',
      icon:  'refresh-circle-outline',
      color: Brand.colors.green.normal,
      onPress: () => { onClose(); onActivate(); },
    });
  } else {
    actions.push({
      label: 'Desactivar cuenta',
      icon:  'close-circle-outline',
      color: Brand.colors.alerts.error,
      onPress: () => { onClose(); onDeactivate(); },
    });
  }

  const bg = isDark ? '#0e1f1c' : '#ffffff';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: bg }]} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={[styles.sheetEmail, { color: colors.textMuted }]}>{user.email}</Text>
          <View style={[styles.sheetDivider, { backgroundColor: colors.border }]} />

          <ScrollView>
            {actions.map((a) => (
              <Pressable key={a.label} style={styles.actionBtn} onPress={a.onPress}>
                <Ionicons name={a.icon as any} size={20} color={a.color} />
                <Text style={[styles.actionLabel, { color: a.color }]}>{a.label}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable
            style={[styles.cancelBtn, { backgroundColor: colors.surfaceAlt }]}
            onPress={onClose}
          >
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancelar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
