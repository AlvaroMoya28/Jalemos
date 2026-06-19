// Status pill for a driver application (pending / under review / approved / …).

import { Text, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { ApplicationStatus } from '@/contexts/applications';
import { badge } from '@/styles/tabs/admin-applications.styles';

export const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; icon: string }> = {
  pending:          { label: 'Pendiente',    color: '#f7a900',                        icon: 'time-outline' },
  under_review:     { label: 'En revisión',  color: Brand.colors.blue.normal,         icon: 'eye-outline' },
  needs_correction: { label: 'Corrección',   color: '#ff7c2a',                        icon: 'alert-circle-outline' },
  approved:         { label: 'Aprobada',     color: Brand.colors.green.normal,        icon: 'checkmark-circle-outline' },
  rejected:         { label: 'Rechazada',    color: Brand.colors.alerts.error,        icon: 'close-circle-outline' },
};

export default function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <View style={[badge.wrap, { backgroundColor: cfg.color + '22', borderColor: cfg.color + '55' }]}>
      <Text style={[badge.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}
