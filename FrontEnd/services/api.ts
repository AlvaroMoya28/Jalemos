const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000';
const TIMEOUT_MS        = 15_000;
const UPLOAD_TIMEOUT_MS = 60_000;

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit, timeoutMs = TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, body.error ?? body.detail ?? `Error ${res.status}`);
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

export function get<T>(path: string, token?: string): Promise<T> {
  return request<T>(path, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export function post<T>(path: string, body: object, token?: string): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export function patch<T>(path: string, body: object, token?: string): Promise<T> {
  return request<T>(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

// Driver Applications

export interface ApplicationVehicle {
  brand: string;
  model: string;
  year: string;
  plate: string;
  color: string;
}

export interface ApplicationFeedback {
  issueIds: string[];
  notes: string;
  reviewedAt: string;
}

export interface DriverApplicationDTO {
  applicationId: string;
  userId: string;
  status: 'pending' | 'under_review' | 'needs_correction' | 'approved' | 'rejected';
  attempts: number;
  cedula: string;
  address: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  vehiclePlate: string;
  vehicleColor: string;
  facePhoto: string | null;
  licensePhotoFront: string | null;
  licensePhotoBack: string | null;
  dekraPhoto: string | null;
  licenseExpiryMonth: number | null;
  licenseExpiryYear: number | null;
  dekraExpiryMonth: number | null;
  dekraExpiryYear: number | null;
  isRenewal: boolean;
  adminIssueIds: string[] | null;
  adminNotes: string | null;
  reviewedAt: string | null;
  submittedAt: string;
  updatedAt: string;
  applicantName: string | null;
  applicantEmail: string | null;
  applicantAvatar: string | null;
}

export interface SubmitApplicationPayload {
  cedula?: string;
  address?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleYear?: number;
  vehiclePlate?: string;
  vehicleColor?: string;
  facePhoto: string | null;
  licensePhotoFront: string | null;
  licensePhotoBack: string | null;
  dekraPhoto: string | null;
  licenseExpiryMonth: number | null;
  licenseExpiryYear: number | null;
  dekraExpiryMonth: number | null;
  dekraExpiryYear: number | null;
  isRenewal?: boolean;
}

export interface ReviewActionPayload {
  issueIds: string[];
  notes: string;
}

// Admin User Management

export interface AdminUserDTO {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'passenger' | 'driver';
  meanRating: number;
  totalTrips: number;
  kms: number;
  isActive: boolean;
  suspendedUntil: string | null;
  createdAt: string;
}

export interface PagedUsersResponse {
  users: AdminUserDTO[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface UsersQueryParams {
  search?: string;
  role?: 'admin' | 'passenger' | 'driver';
  status?: 'active' | 'suspended' | 'deactivated';
  sortBy?: 'name_asc' | 'name_desc' | 'rating_asc' | 'rating_desc' | 'trips_asc' | 'trips_desc' | 'newest' | 'oldest';
  page?: number;
  pageSize?: number;
}

export const usersApi = {
  getAll: (params: UsersQueryParams, token: string) => {
    const qs = new URLSearchParams();
    if (params.search)   qs.set('search',   params.search);
    if (params.role)     qs.set('role',     params.role);
    if (params.status)   qs.set('status',   params.status);
    if (params.sortBy)   qs.set('sortBy',   params.sortBy);
    if (params.page)     qs.set('page',     String(params.page));
    if (params.pageSize) qs.set('pageSize', String(params.pageSize));
    const q = qs.toString();
    return get<PagedUsersResponse>(`/api/users${q ? `?${q}` : ''}`, token);
  },

  getById: (id: string, token: string) =>
    get<AdminUserDTO>(`/api/users/${id}`, token),

  changeRole: (id: string, role: 'admin' | 'passenger' | 'driver', token: string) =>
    patch<void>(`/api/users/${id}/role`, { role }, token),

  ban: (id: string, days: number, token: string) =>
    patch<void>(`/api/users/${id}/ban`, { days }, token),

  liftBan: (id: string, token: string) =>
    patch<void>(`/api/users/${id}/lift-ban`, {}, token),

  deactivate: (id: string, token: string) =>
    patch<void>(`/api/users/${id}/deactivate`, {}, token),

  activate: (id: string, token: string) =>
    patch<void>(`/api/users/${id}/activate`, {}, token),
};

// Driver Applications

export const applicationsApi = {
  getMy: (token: string) =>
    get<DriverApplicationDTO | null>('/api/driver-applications/my', token),

  getAll: (token: string, status?: string) =>
    get<DriverApplicationDTO[]>(
      `/api/driver-applications${status ? `?status=${status}` : ''}`,
      token
    ),

  getById: (id: string, token: string) =>
    get<DriverApplicationDTO>(`/api/driver-applications/${id}`, token),

  submit: (payload: SubmitApplicationPayload, token: string) =>
    request<DriverApplicationDTO>('/api/driver-applications', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    }, UPLOAD_TIMEOUT_MS),

  resubmit: (id: string, payload: SubmitApplicationPayload, token: string) =>
    request<DriverApplicationDTO>(`/api/driver-applications/${id}/resubmit`, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    }, UPLOAD_TIMEOUT_MS),

  setUnderReview: (id: string, token: string) =>
    patch<void>(`/api/driver-applications/${id}/under-review`, {}, token),

  requestCorrection: (id: string, payload: ReviewActionPayload, token: string) =>
    patch<void>(`/api/driver-applications/${id}/request-correction`, payload, token),

  approve: (id: string, token: string) =>
    patch<void>(`/api/driver-applications/${id}/approve`, {}, token),

  reject: (id: string, payload: ReviewActionPayload, token: string) =>
    patch<void>(`/api/driver-applications/${id}/reject`, payload, token),
};
