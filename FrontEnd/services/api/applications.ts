// Driver applications API (submit, review, vehicle applications).
import { get, patch, post, request, UPLOAD_TIMEOUT_MS } from "./client";

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

  requestCorrection: (id: string, payload: ReviewActionPayload, token: string) =>
    patch<void>(`/api/driver-applications/${id}/request-correction`, payload, token),

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
