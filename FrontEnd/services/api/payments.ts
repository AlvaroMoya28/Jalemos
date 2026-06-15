import { get, post, patch, del } from './client';

export interface PaymentMethodDto {
  id: string;
  type: 'card' | 'sinpe' | 'cash';
  alias: string;
  lastFourDigits: string | null;
  brand: string | null;
  expiryMonth: number | null;
  expiryYear: number | null;
  isFavorite: boolean;
  createdAt: string;
}

export interface LastUsedPaymentMethodDto {
  paymentMethodId: string;
  type: string;
  alias: string;
  lastFourDigits: string | null;
  brand: string | null;
}

export interface PaymentDto {
  id: string;
  bookingId: string;
  amount: number;
  method: string;
  status: 'pending' | 'confirmed' | 'failed';
  paymentMethodId: string | null;
  createdAt: string;
  updatedAt: string;
}

export const paymentsApi = {
  getMethods: (token: string) =>
    get<PaymentMethodDto[]>('/api/payments/methods', token),

  addCard: (stripePaymentMethodId: string, alias: string | undefined, token: string) =>
    post<PaymentMethodDto>('/api/payments/methods/card', { stripePaymentMethodId, alias }, token),

  addSimple: (type: 'sinpe' | 'cash', alias: string, token: string) =>
    post<PaymentMethodDto>('/api/payments/methods/simple', { type, alias }, token),

  setFavorite: (id: string, token: string) =>
    patch<void>(`/api/payments/methods/${id}/favorite`, {}, token),

  deleteMethod: (id: string, token: string) =>
    del<void>(`/api/payments/methods/${id}`, token),

  getLastUsed: (token: string) =>
    get<LastUsedPaymentMethodDto>('/api/payments/methods/last-used', token),

  createPayment: (
    body: { bookingId: string; amount: number; method: string; paymentMethodId?: string },
    token: string,
  ) => post<PaymentDto>('/api/payments', body, token),

  confirmPayment: (id: string, token: string) =>
    post<PaymentDto>(`/api/payments/${id}/confirm`, {}, token),

  getByBooking: (bookingId: string, token: string) =>
    get<PaymentDto>(`/api/payments/booking/${bookingId}`, token),
};
