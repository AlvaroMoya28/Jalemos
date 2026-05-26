const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000';
const TIMEOUT_MS = 15_000;

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, body.error ?? `Error ${res.status}`);
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
  licensePhotoFront: string | null;
  licensePhotoBack: string | null;
  dekraPhoto: string | null;
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
  cedula: string;
  address: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  vehiclePlate: string;
  vehicleColor: string;
  licensePhotoFront: string | null;
  licensePhotoBack: string | null;
  dekraPhoto: string | null;
}

export interface ReviewActionPayload {
  issueIds: string[];
  notes: string;
}

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
    post<DriverApplicationDTO>('/api/driver-applications', payload, token),

  resubmit: (id: string, payload: SubmitApplicationPayload, token: string) =>
    post<DriverApplicationDTO>(`/api/driver-applications/${id}/resubmit`, payload, token),

  setUnderReview: (id: string, token: string) =>
    patch<void>(`/api/driver-applications/${id}/under-review`, {}, token),

  requestCorrection: (id: string, payload: ReviewActionPayload, token: string) =>
    patch<void>(`/api/driver-applications/${id}/request-correction`, payload, token),

  approve: (id: string, token: string) =>
    patch<void>(`/api/driver-applications/${id}/approve`, {}, token),

  reject: (id: string, payload: ReviewActionPayload, token: string) =>
    patch<void>(`/api/driver-applications/${id}/reject`, payload, token),
};
