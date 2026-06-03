const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5000";
const TIMEOUT_MS = 15_000;
const UPLOAD_TIMEOUT_MS = 60_000;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: RequestInit,
  timeoutMs = TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...options.headers },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(
        res.status,
        body.error ?? body.detail ?? `Error ${res.status}`,
      );
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

export function get<T>(path: string, token?: string): Promise<T> {
  return request<T>(path, {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export function post<T>(
  path: string,
  body: object,
  token?: string,
): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export function patch<T>(
  path: string,
  body: object,
  token?: string,
): Promise<T> {
  return request<T>(path, {
    method: "PATCH",
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
  applicationType: 'driver' | 'vehicle';
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
  cooldownUntil: string | null;
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

export interface SubmitVehicleApplicationPayload {
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  vehiclePlate: string;
  vehicleColor: string;
}

// Vehicles

export interface VehicleDTO {
  vehicleId: string;
  userId: string;
  brand: string;
  model: string;
  year: number;
  numPlate: string;
  color: string;
  active: boolean;
  createdAt: string;
}

export const vehiclesApi = {
  getMy: (token: string) =>
    get<VehicleDTO[]>('/api/vehicles/my', token),

  getByUserId: (userId: string, token: string) =>
    get<VehicleDTO[]>(`/api/vehicles/user/${userId}`, token),

  delete: (vehicleId: string, token: string) =>
    request<void>(`/api/vehicles/${vehicleId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }),
};

// Admin User Management

export interface AdminUserDTO {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "passenger" | "driver";
  meanRating: number;
  totalTrips: number;
  kms: number;
  isActive: boolean;
  suspendedUntil: string | null;
  createdAt: string;
  profilePhotoUrl: string | null;
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
  role?: "admin" | "passenger" | "driver";
  status?: "active" | "suspended" | "deactivated";
  sortBy?:
    | "name_asc"
    | "name_desc"
    | "rating_asc"
    | "rating_desc"
    | "trips_asc"
    | "trips_desc"
    | "newest"
    | "oldest";
  page?: number;
  pageSize?: number;
}

export const usersApi = {
  getAll: (params: UsersQueryParams, token: string) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.role) qs.set("role", params.role);
    if (params.status) qs.set("status", params.status);
    if (params.sortBy) qs.set("sortBy", params.sortBy);
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    const q = qs.toString();
    return get<PagedUsersResponse>(`/api/users${q ? `?${q}` : ""}`, token);
  },

  getById: (id: string, token: string) =>
    get<AdminUserDTO>(`/api/users/${id}`, token),

  changeRole: (
    id: string,
    role: "admin" | "passenger" | "driver",
    token: string,
  ) => patch<void>(`/api/users/${id}/role`, { role }, token),

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
    get<DriverApplicationDTO | null>("/api/driver-applications/my", token),

  getAll: (token: string, status?: string) =>
    get<DriverApplicationDTO[]>(
      `/api/driver-applications${status ? `?status=${status}` : ""}`,
      token,
    ),

  getById: (id: string, token: string) =>
    get<DriverApplicationDTO>(`/api/driver-applications/${id}`, token),

  submit: (payload: SubmitApplicationPayload, token: string) =>
    request<DriverApplicationDTO>(
      "/api/driver-applications",
      {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
      UPLOAD_TIMEOUT_MS,
    ),

  resubmit: (id: string, payload: SubmitApplicationPayload, token: string) =>
    request<DriverApplicationDTO>(
      `/api/driver-applications/${id}/resubmit`,
      {
        method: "POST",
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
      UPLOAD_TIMEOUT_MS,
    ),

  setUnderReview: (id: string, token: string) =>
    patch<void>(`/api/driver-applications/${id}/under-review`, {}, token),

  requestCorrection: (
    id: string,
    payload: ReviewActionPayload,
    token: string,
  ) =>
    patch<void>(
      `/api/driver-applications/${id}/request-correction`,
      payload,
      token,
    ),

  approve: (id: string, token: string) =>
    patch<void>(`/api/driver-applications/${id}/approve`, {}, token),

  reject: (id: string, payload: ReviewActionPayload, token: string) =>
    patch<void>(`/api/driver-applications/${id}/reject`, payload, token),

  liftCooldown: (id: string, token: string) =>
    patch<void>(`/api/driver-applications/${id}/lift-cooldown`, {}, token),

  submitVehicle: (payload: SubmitVehicleApplicationPayload, token: string) =>
    post<DriverApplicationDTO>('/api/driver-applications/vehicle', payload, token),

  getMyVehicles: (token: string) =>
    get<DriverApplicationDTO[]>('/api/driver-applications/my-vehicles', token),
};

// Bookings
export const bookingsApi = {
  create: (tripId: string, seatsReserved: number, estimatedAmount: number | null, token?: string) =>
    post<any>(`/api/bookings`, { tripId, seatsReserved, estimatedAmount }, token),
  getAll: (token?: string) => get<any[]>(`/api/bookings`, token),
  getById: (id: string, token?: string) => get<any>(`/api/bookings/${id}`, token),
  delete: (id: string, token?: string) =>
    request<void>(`/api/bookings/${id}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} }),
  cancel: (id: string, reason: string, details: string | null, token?: string) =>
    post<void>(`/api/bookings/${id}/cancel`, { reason, details }, token),
};

// Trip lifecycle types
export interface PassengerSummary {
  bookingId: string;
  passengerId: string;
  firstName: string;
  lastName: string;
  seatsReserved: number;
  bookingState: 'pending' | 'confirmed' | 'boarded' | 'no_show' | 'cancelled' | 'completed';
  boardedAt: string | null;
}

export interface TripStatusResponse {
  tripId: string;
  state: 'scheduled' | 'boarding' | 'in_progress' | 'completed' | 'cancelled';
  origin: string;
  destination: string;
  originLatitude: number;
  originLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
  departureAt: string;
  rate: number;
  driverFirstName: string;
  driverLastName: string;
  driverId: string;
  boardingStartedAt: string | null;
  journeyStartedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  cancelDetails: string | null;
  passengers: PassengerSummary[];
}

export interface ActivePassengerTrip {
  tripId: string;
  tripState: 'boarding' | 'in_progress' | 'completed' | 'cancelled';
  origin: string;
  destination: string;
  originLatitude: number;
  originLongitude: number;
  destinationLatitude: number;
  destinationLongitude: number;
  departureAt: string;
  rate: number;
  driverId: string;
  driverFirstName: string;
  driverLastName: string;
  driverRating: number;
  boardingStartedAt: string | null;
  journeyStartedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  cancelDetails: string | null;
  isLateCancellation: boolean;
  bookingId: string;
  bookingState: 'pending' | 'confirmed' | 'boarded' | 'no_show' | 'cancelled' | 'completed';
  boardedAt: string | null;
}

export interface QrScanResult {
  bookingId: string;
  passengerId: string;
  firstName: string;
  lastName: string;
  seatsReserved: number;
  alreadyBoarded: boolean;
}

export interface MeResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  role: string;
  meanRating: number;
  totalTrips: number;
  kms: number;
  profilePhotoUrl: string | null;
  qrToken: string;
}

// Trip lifecycle API
export const tripLifecycleApi = {
  getActiveDriver: (token: string) =>
    get<TripStatusResponse | null>('/api/trips/active-driver', token),

  getActivePassenger: (token: string) =>
    get<ActivePassengerTrip | null>('/api/trips/active-passenger', token),

  getStatus: (tripId: string, token: string) =>
    get<TripStatusResponse>(`/api/trips/${tripId}/status`, token),

  startBoarding: (tripId: string, token: string) =>
    post<TripStatusResponse>(`/api/trips/${tripId}/start-boarding`, {}, token),

  scanQr: (tripId: string, qrToken: string, token: string) =>
    post<QrScanResult>(`/api/trips/${tripId}/scan-qr`, { qrToken }, token),

  startJourney: (tripId: string, token: string) =>
    post<TripStatusResponse>(`/api/trips/${tripId}/start-journey`, {}, token),

  completeTrip: (tripId: string, token: string) =>
    post<TripStatusResponse>(`/api/trips/${tripId}/complete`, {}, token),

  cancelTrip: (tripId: string, reason: string, details: string | null, token: string) =>
    post<void>(`/api/trips/${tripId}/cancel`, { reason, details }, token),

  markNoShow: (bookingId: string, token: string) =>
    post<void>(`/api/trips/bookings/${bookingId}/no-show`, {}, token),
};

// Ratings API
export interface SubmitRatingPayload {
  tripId: string;
  ratedId: string;
  score: number;
  comment?: string;
}

export interface RatingDTO {
  id: string;
  tripId: string;
  raterId: string;
  ratedId: string;
  score: number;
  comment: string | null;
  createdAt: string;
}

export const ratingsApi = {
  getByUser: (userId: string) =>
    get<RatingDTO[]>(`/api/ratings/user/${userId}`),

  submit: (payload: SubmitRatingPayload, token: string) =>
    post<RatingDTO>('/api/ratings', payload, token),

  delete: (id: string, token: string) =>
    request<void>(`/api/ratings/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }),
};

// User /me endpoint
export const meApi = {
  get: (token: string) => get<MeResponse>('/api/users/me', token),
};
