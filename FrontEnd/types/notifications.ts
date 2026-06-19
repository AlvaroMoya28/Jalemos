// Shared notification domain types (E0-2). Used by the API client, the
// useNotifications hook, and the notifications UI. Mirrors the backend wire format.

// snake_case type names emitted by the backend (NotificationMapper.ToSnake).
export type NotificationKind =
  | 'booking_received'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'trip_starting'
  | 'trip_completed'
  | 'rating_received'
  | 'general'
  | 'trip_boarding'
  | 'qr_scanned'
  | 'trip_started'
  | 'driver_cancelled'
  | 'passenger_cancelled'
  | 'passenger_cancelled_late'
  | 'no_show_marked'
  | 'payment_reminder'
  | 'rating_reminder'
  | 'admin_broadcast';

export type NotificationAudience = 'all' | 'passenger' | 'driver';

export interface NotificationDTO {
  id: string;
  type: NotificationKind;
  title: string;
  body: string | null;
  tripId: string | null;
  bookingId: string | null;
  passengerId: string | null;
  read: boolean;
  audience: NotificationAudience;
  createdAt: string;
}

export type BroadcastSegment = 'All' | 'Passengers' | 'Drivers';

export interface BroadcastPayload {
  title: string;
  body?: string;
  segment: BroadcastSegment;
}

export interface NotificationPrefs {
  preferences: Record<string, boolean>;
}
