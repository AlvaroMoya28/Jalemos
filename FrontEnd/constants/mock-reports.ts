// User report types and seed data for the admin moderation panel.

export type ReportReason =
  | 'bad_behavior'
  | 'dangerous_driving'
  | 'no_show'
  | 'late_cancellation'
  | 'harassment'
  | 'vehicle_condition'
  | 'other';

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  bad_behavior:       'Mal comportamiento',
  dangerous_driving:  'Manejo peligroso',
  no_show:            'No se presentó',
  late_cancellation:  'Cancelación tardía',
  harassment:         'Acoso',
  vehicle_condition:  'Estado del vehículo',
  other:              'Otro',
};

export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface UserReport {
  id: string;
  reportedUserId: string;
  reportedUserName: string;
  reportedUserAvatar: string;
  reportedUserRole: 'passenger' | 'passenger+driver';
  reportedById: string;
  reportedByName: string;
  reportedByAvatar: string;
  reason: ReportReason;
  details: string;
  createdAt: string;
  status: ReportStatus;
  adminAction?: {
    type: 'suspended' | 'deactivated' | 'dismissed';
    suspensionDays?: number;
    resolvedAt: string;
  };
}

export const SEED_REPORTS: UserReport[] = [
  {
    id: 'rep-001',
    reportedUserId: 'driver-0',
    reportedUserName: 'Carlos Monestel',
    reportedUserAvatar: 'CM',
    reportedUserRole: 'passenger+driver',
    reportedById: 'user-pasajero',
    reportedByName: 'Álvaro Moya',
    reportedByAvatar: 'AM',
    reason: 'bad_behavior',
    details: 'El conductor fue muy grosero durante el viaje, usó lenguaje ofensivo cuando le pedí que bajara el volumen de la música.',
    createdAt: '2026-05-21T18:30:00Z',
    status: 'pending',
  },
  {
    id: 'rep-002',
    reportedUserId: 'user-pasajero',
    reportedUserName: 'Álvaro Moya',
    reportedUserAvatar: 'AM',
    reportedUserRole: 'passenger',
    reportedById: 'driver-1',
    reportedByName: 'María Rodríguez',
    reportedByAvatar: 'MR',
    reason: 'no_show',
    details: 'El pasajero reservó el viaje y no se presentó en el punto de encuentro. Esperé 15 minutos y no contestó llamadas.',
    createdAt: '2026-05-20T07:45:00Z',
    status: 'pending',
  },
  {
    id: 'rep-003',
    reportedUserId: 'driver-2',
    reportedUserName: 'José Ledezma',
    reportedUserAvatar: 'JL',
    reportedUserRole: 'passenger+driver',
    reportedById: 'user-pasajero',
    reportedByName: 'Álvaro Moya',
    reportedByAvatar: 'AM',
    reason: 'dangerous_driving',
    details: 'El conductor manejó a exceso de velocidad en la ruta 27 y pasó dos semáforos en rojo. Me sentí en peligro durante todo el viaje.',
    createdAt: '2026-05-19T09:10:00Z',
    status: 'resolved',
    adminAction: {
      type: 'suspended',
      suspensionDays: 7,
      resolvedAt: '2026-05-19T14:00:00Z',
    },
  },
  {
    id: 'rep-004',
    reportedUserId: 'driver-3',
    reportedUserName: 'Ana Picado',
    reportedUserAvatar: 'AP',
    reportedUserRole: 'passenger+driver',
    reportedById: 'driver-1',
    reportedByName: 'María Rodríguez',
    reportedByAvatar: 'MR',
    reason: 'late_cancellation',
    details: 'Canceló el viaje 5 minutos antes de la hora acordada sin previo aviso. Varios pasajeros quedaron sin transporte.',
    createdAt: '2026-05-17T16:50:00Z',
    status: 'dismissed',
    adminAction: {
      type: 'dismissed',
      resolvedAt: '2026-05-18T10:00:00Z',
    },
  },
  {
    id: 'rep-005',
    reportedUserId: 'driver-1',
    reportedUserName: 'María Rodríguez',
    reportedUserAvatar: 'MR',
    reportedUserRole: 'passenger+driver',
    reportedById: 'user-pasajero',
    reportedByName: 'Álvaro Moya',
    reportedByAvatar: 'AM',
    reason: 'vehicle_condition',
    details: 'El vehículo tenía el cinturón de seguridad del asiento trasero roto y olía muy fuerte a cigarrillo.',
    createdAt: '2026-05-16T11:20:00Z',
    status: 'pending',
  },
];
