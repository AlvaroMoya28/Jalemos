import { get, post, patch, del } from './client';

export type SimBehavior = 'declined' | 'insufficient_funds' | 'expired' | 'incorrect_cvv' | null;

export interface PaymentMethodDto {
  id: string;
  type: 'card' | 'sinpe' | 'cash';
  alias: string;
  lastFourDigits: string | null;
  brand: string | null;
  expiryMonth: number | null;
  expiryYear: number | null;
  isFavorite: boolean;
  simBehavior: SimBehavior;
  createdAt: string;
}

export function paymentMethodLabel(method: string): string {
  switch (method) {
    case 'card':  return 'Tarjeta';
    case 'sinpe': return 'SINPE Móvil';
    case 'cash':  return 'Efectivo';
    default:      return method;
  }
}

export function simBehaviorLabel(b: SimBehavior): { text: string; color: string } | null {
  switch (b) {
    case 'declined':           return { text: 'Rechazada', color: '#e53e3e' };
    case 'insufficient_funds': return { text: 'Fondos insuficientes', color: '#e53e3e' };
    case 'expired':            return { text: 'Expirada', color: '#e53e3e' };
    case 'incorrect_cvv':      return { text: 'CVV incorrecto', color: '#dd6b20' };
    default:                   return null;
  }
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

export interface AddCardDto {
  cardNumber: string;
  expiryMonth: number;
  expiryYear: number;
  cardholderName: string;
  alias?: string;
}

export const paymentsApi = {
  getMethods: (token: string) =>
    get<PaymentMethodDto[]>('/api/payments/methods', token),

  addCard: (data: AddCardDto, token: string) =>
    post<PaymentMethodDto>('/api/payments/methods/card', data, token),

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
