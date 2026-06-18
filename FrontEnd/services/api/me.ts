// Current-user (/me) API.
import { get, post, request, UPLOAD_TIMEOUT_MS } from "./client";

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

export const meApi = {
  get: (token: string) => get<MeResponse>('/api/users/me', token),

  // Uploads a base64 JPEG profile photo. Returns the stored public URL.
  // Uses the longer upload timeout since base64 payloads can be large.
  uploadPhoto: (base64: string, token: string) =>
    request<{ profilePhotoUrl: string }>(
      '/api/users/me/photo',
      {
        method: 'POST',
        body: JSON.stringify({ image: base64 }),
        headers: { Authorization: `Bearer ${token}` },
      },
      UPLOAD_TIMEOUT_MS,
    ),

  // Emails the user their boarding QR. Backend enforces a 5-minute cooldown (429 if too soon).
  sendQr: (token: string) =>
    post<{ message: string }>('/api/users/me/send-qr', {}, token),
};
