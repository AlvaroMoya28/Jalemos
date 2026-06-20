// Small inline badges/indicators for the user-management panel:
// role pill, account-status pill and the 5-star rating row.

import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { badge, starsInline } from '@/styles/tabs/admin-users.styles';

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  admin:     { label: 'Admin',     color: '#9b59b6' },
  driver:    { label: 'Conductor', color: Brand.colors.blue.normal },
  passenger: { label: 'Pasajero',  color: Brand.colors.green.normal },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  active:      { label: 'Activo',      color: Brand.colors.green.normal,  icon: 'checkmark-circle-outline' },
  suspended:   { label: 'Suspendido',  color: '#f7a900',                  icon: 'time-outline' },
  deactivated: { label: 'Desactivado', color: Brand.colors.alerts.error,  icon: 'ban-outline' },
};

export function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role] ?? ROLE_CONFIG.passenger;
  return (
    <View style={[badge.wrap, { backgroundColor: cfg.color + '22', borderColor: cfg.color + '55' }]}>
      <Text style={[badge.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.active;
  return (
    <View style={[badge.wrap, { backgroundColor: cfg.color + '22', borderColor: cfg.color + '55' }]}>
      <Ionicons name={cfg.icon as any} size={10} color={cfg.color} />
      <Text style={[badge.text, { color: cfg.color, marginLeft: 3 }]}>{cfg.label}</Text>
    </View>
  );
}

export function Stars({ value }: { value: number }) {
  const filled = Math.round(value);
  return (
    <View style={starsInline.row}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Ionicons
          key={i}
          name={i < filled ? 'star' : 'star-outline'}
          size={11}
          color={Brand.colors.yellow.normal}
        />
      ))}
    </View>
  );
}
