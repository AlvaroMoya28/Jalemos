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
  // Abort the request after TIMEOUT_MS so the loader never hangs forever
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

    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

export function post<T>(path: string, body: object, token?: string): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}

export function get<T>(path: string, token?: string): Promise<T> {
  return request<T>(path, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
