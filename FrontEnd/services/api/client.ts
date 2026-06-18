// Shared HTTP client for every domain API module.
// Owns the base URL, timeouts, auth header wiring, and error normalisation so each
// domain file (trips, bookings, notifications…) only declares its endpoints.

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:5000";
export const TIMEOUT_MS = 15_000;
export const UPLOAD_TIMEOUT_MS = 60_000;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: any,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function request<T>(
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
        body,
      );
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

const authHeader = (token?: string): Record<string, string> =>
  token ? { Authorization: `Bearer ${token}` } : {};

export function get<T>(path: string, token?: string): Promise<T> {
  return request<T>(path, { method: "GET", headers: authHeader(token) });
}

export function post<T>(path: string, body: object, token?: string): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
    headers: authHeader(token),
  });
}

export function patch<T>(path: string, body: object, token?: string): Promise<T> {
  return request<T>(path, {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: authHeader(token),
  });
}

export function put<T>(path: string, body: object, token?: string): Promise<T> {
  return request<T>(path, {
    method: "PUT",
    body: JSON.stringify(body),
    headers: authHeader(token),
  });
}

export function del<T>(path: string, token?: string): Promise<T> {
  return request<T>(path, { method: "DELETE", headers: authHeader(token) });
}
