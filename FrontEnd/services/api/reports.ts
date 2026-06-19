import { post, get, patch } from './client';

export interface CreateTripReportDto {
  tripId: string;
  type: 'emergency' | 'driver_report';
  description: string;
}

export interface TripReportDto {
  id: string;
  tripId: string;
  driverId: string;
  reporterId: string;
  type: 'emergency' | 'driver_report';
  status: 'open' | 'verified' | 'dismissed' | 'action_taken';
  description: string;
  adminNotes: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const reportsApi = {
  create: (dto: CreateTripReportDto, token: string) =>
    post<TripReportDto>('/api/trip-reports', dto, token),

  getAll: (token: string, status?: string, page = 1, pageSize = 50) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status) params.set('status', status);
    return get<TripReportDto[]>(`/api/trip-reports?${params}`, token);
  },

  getById: (id: string, token: string) =>
    get<TripReportDto>(`/api/trip-reports/${id}`, token),

  updateStatus: (id: string, status: string, adminNotes: string | null, token: string) =>
    patch<TripReportDto>(`/api/trip-reports/${id}/status`, { status, adminNotes }, token),
};
