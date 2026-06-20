// Shared display config + option lists for the reports moderation panel.

import { Brand } from '@/constants/theme';

export type TripView = 'all' | 'open' | 'verified' | 'dismissed' | 'action_taken';

export const REASON_COLORS: Record<string, string> = {
  bad_behavior:      '#ff7c2a',
  dangerous_driving: Brand.colors.alerts.error,
  no_show:           '#f7a900',
  late_cancellation: '#f7a900',
  harassment:        Brand.colors.alerts.error,
  vehicle_condition: '#9c6bff',
  other:             Brand.colors.black.b6,
};

export const SUSPENSION_OPTIONS = [
  { days: 1,  label: '1 día' },
  { days: 3,  label: '3 días' },
  { days: 7,  label: '7 días' },
  { days: 30, label: '30 días' },
];

export const TRIP_TYPE_CONFIG = {
  emergency:     { label: 'Emergencia', color: '#e53e3e', icon: 'warning'       as const },
  driver_report: { label: 'Reporte',    color: '#f4a522', icon: 'person-remove' as const },
};

export const TRIP_STATUS_CONFIG = {
  open:         { label: 'Abierto',         color: '#e53e3e' },
  verified:     { label: 'Verificado',      color: '#f4a522' },
  dismissed:    { label: 'Desestimado',     color: '#718096' },
  action_taken: { label: 'Acción tomada',   color: Brand.colors.green.normal },
};
