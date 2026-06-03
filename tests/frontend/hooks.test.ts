/**
 * @jest-environment jsdom
 */

import { act, renderHook } from '@testing-library/react';

// ── Mock factories ──────────────────────────────────────────────────────────────
// Must be declared before jest.mock() so they can be referenced in factories.
// ts-jest hoists jest.mock() calls, but variable references must be "mock"-prefixed
// (babel-jest restriction) or declared inline.

const mockUseColorScheme = jest.fn().mockReturnValue('light');
const mockRequestForegroundPermissionsAsync = jest.fn();
const mockGetCurrentPositionAsync = jest.fn();
const mockReverseGeocodeAsync = jest.fn();
const mockUseAuth = jest.fn().mockReturnValue({ token: null });
const mockGet = jest.fn();

jest.mock('react-native', () => ({
  Platform: { OS: 'ios', select: (obj: Record<string, unknown>) => obj['ios'] ?? obj['default'] },
  useColorScheme: mockUseColorScheme,
}));

jest.mock('@/constants/theme', () => ({
  Colors: {
    light: { text: '#000000', background: '#ffffff', tint: '#aabbcc' },
    dark:  { text: '#ffffff', background: '#111111', tint: '#ddeeff' },
  },
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: mockRequestForegroundPermissionsAsync,
  getCurrentPositionAsync: mockGetCurrentPositionAsync,
  reverseGeocodeAsync: mockReverseGeocodeAsync,
  Accuracy: { Balanced: 3 },
}));

jest.mock('@/contexts/auth', () => ({
  useAuth: mockUseAuth,
}));

jest.mock('@/services/api', () => {
  class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
    }
  }
  return { get: mockGet, ApiError };
});

// ── Lazy hook imports (after mocks are registered) ─────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { useColorScheme: useColorSchemeWeb } = require('../../FrontEnd/hooks/use-color-scheme.web');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { useAppTheme } = require('../../FrontEnd/hooks/use-app-theme');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { useThemeColor } = require('../../FrontEnd/hooks/use-theme-color');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { useCurrentLocation } = require('../../FrontEnd/hooks/use-current-location');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { useTripsData } = require('../../FrontEnd/hooks/use-trips-data');

// ── MockApiError ───────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ApiError: MockApiError } = require('@/services/api');

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('FrontEnd hooks', () => {

  // ── use-color-scheme.web ────────────────────────────────────────────────────

  describe('use-color-scheme.web', () => {
    beforeEach(() => {
      mockUseColorScheme.mockReturnValue('light');
    });

    it('returns dark device scheme after hydration', async () => {
      mockUseColorScheme.mockReturnValue('dark');
      const { result } = renderHook(() => useColorSchemeWeb());
      await act(async () => {});
      expect(result.current).toBe('dark');
    });

    it('returns light device scheme after hydration', async () => {
      mockUseColorScheme.mockReturnValue('light');
      const { result } = renderHook(() => useColorSchemeWeb());
      await act(async () => {});
      expect(result.current).toBe('light');
    });
  });

  // ── use-app-theme ───────────────────────────────────────────────────────────

  describe('use-app-theme', () => {
    beforeEach(() => {
      mockUseColorScheme.mockReturnValue('light');
    });

    it('returns isDark=false with light colors when scheme is light', () => {
      const { result } = renderHook(() => useAppTheme());
      expect(result.current.isDark).toBe(false);
      expect(result.current.scheme).toBe('light');
      expect(result.current.colors).toEqual({ text: '#000000', background: '#ffffff', tint: '#aabbcc' });
    });

    it('returns isDark=true with dark colors when scheme is dark', () => {
      mockUseColorScheme.mockReturnValue('dark');
      const { result } = renderHook(() => useAppTheme());
      expect(result.current.isDark).toBe(true);
      expect(result.current.scheme).toBe('dark');
      expect(result.current.colors).toEqual({ text: '#ffffff', background: '#111111', tint: '#ddeeff' });
    });

    it('falls back to light when scheme is null', () => {
      mockUseColorScheme.mockReturnValue(null);
      const { result } = renderHook(() => useAppTheme());
      expect(result.current.isDark).toBe(false);
      expect(result.current.scheme).toBe('light');
      expect(result.current.colors).toEqual({ text: '#000000', background: '#ffffff', tint: '#aabbcc' });
    });
  });

  // ── use-theme-color ─────────────────────────────────────────────────────────

  describe('use-theme-color', () => {
    it('returns the light prop override when scheme is light', () => {
      mockUseColorScheme.mockReturnValue('light');
      const { result } = renderHook(() =>
        useThemeColor({ light: '#override-light', dark: '#override-dark' }, 'text'),
      );
      expect(result.current).toBe('#override-light');
    });

    it('returns the dark prop override when scheme is dark', () => {
      mockUseColorScheme.mockReturnValue('dark');
      const { result } = renderHook(() =>
        useThemeColor({ light: '#override-light', dark: '#override-dark' }, 'text'),
      );
      expect(result.current).toBe('#override-dark');
    });

    it('falls back to Colors.light[colorName] when no light prop override', () => {
      mockUseColorScheme.mockReturnValue('light');
      const { result } = renderHook(() => useThemeColor({}, 'tint'));
      expect(result.current).toBe('#aabbcc');
    });

    it('falls back to Colors.dark[colorName] when no dark prop override', () => {
      mockUseColorScheme.mockReturnValue('dark');
      const { result } = renderHook(() => useThemeColor({}, 'background'));
      expect(result.current).toBe('#111111');
    });

    it('falls back to light theme when scheme is null', () => {
      mockUseColorScheme.mockReturnValue(null);
      const { result } = renderHook(() => useThemeColor({}, 'text'));
      expect(result.current).toBe('#000000');
    });
  });

  // ── use-current-location ────────────────────────────────────────────────────

  describe('use-current-location', () => {
    beforeEach(() => {
      mockRequestForegroundPermissionsAsync.mockReset();
      mockGetCurrentPositionAsync.mockReset();
      mockReverseGeocodeAsync.mockReset();
    });

    it('starts with idle state', () => {
      const { result } = renderHook(() => useCurrentLocation());
      expect(result.current.state).toEqual({ status: 'idle' });
    });

    it('sets granted state with full address when all geocode parts are present', async () => {
      mockRequestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
      mockGetCurrentPositionAsync.mockResolvedValue({
        coords: { latitude: 9.9281, longitude: -84.0907 },
      });
      mockReverseGeocodeAsync.mockResolvedValue([{
        street: 'Avenida Central',
        streetNumber: '10',
        district: 'Centro',
        city: 'San José',
      }]);

      const { result } = renderHook(() => useCurrentLocation());
      let location: { address: string; coords: { lat: number; lng: number } } | null = null;
      await act(async () => { location = await result.current.fetch(); });

      expect(result.current.state).toEqual({
        status: 'granted',
        address: 'Avenida Central 10, Centro, San José',
        coords: { lat: 9.9281, lng: -84.0907 },
      });
      expect(location?.address).toBe('Avenida Central 10, Centro, San José');
    });

    it('uses only street name when streetNumber is absent', async () => {
      mockRequestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
      mockGetCurrentPositionAsync.mockResolvedValue({
        coords: { latitude: 9.9, longitude: -84.1 },
      });
      mockReverseGeocodeAsync.mockResolvedValue([{
        street: 'Calle 5',
        streetNumber: null,
        subregion: 'Sabana',
        region: 'San José',
      }]);

      const { result } = renderHook(() => useCurrentLocation());
      await act(async () => { await result.current.fetch(); });

      const state = result.current.state as { status: 'granted'; address: string };
      expect(state.address).toBe('Calle 5, Sabana, San José');
    });

    it('falls back to coordinate string when geocode has no usable parts', async () => {
      mockRequestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
      mockGetCurrentPositionAsync.mockResolvedValue({
        coords: { latitude: 9.12345, longitude: -84.56789 },
      });
      mockReverseGeocodeAsync.mockResolvedValue([{}]);

      const { result } = renderHook(() => useCurrentLocation());
      await act(async () => { await result.current.fetch(); });

      const state = result.current.state as { status: 'granted'; address: string };
      expect(state.address).toBe('9.12345, -84.56789');
    });

    it('sets denied state when permission is denied', async () => {
      mockRequestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });

      const { result } = renderHook(() => useCurrentLocation());
      let address: string | null = null;
      await act(async () => { address = await result.current.fetch(); });

      expect(result.current.state).toEqual({ status: 'denied' });
      expect(address).toBeNull();
    });

    it('sets error state when an exception is thrown during location fetch', async () => {
      mockRequestForegroundPermissionsAsync.mockRejectedValue(new Error('unavailable'));

      const { result } = renderHook(() => useCurrentLocation());
      let address: string | null = null;
      await act(async () => { address = await result.current.fetch(); });

      expect(result.current.state).toEqual({
        status: 'error',
        message: 'No se pudo obtener la ubicación',
      });
      expect(address).toBeNull();
    });

    it('ignores a second fetch call while the first is still in flight', async () => {
      let resolveFirst!: (v: { status: string }) => void;
      mockRequestForegroundPermissionsAsync.mockReturnValue(
        new Promise<{ status: string }>((res) => { resolveFirst = res; }),
      );

      const { result } = renderHook(() => useCurrentLocation());
      let secondResult: string | null = 'unset' as unknown as null;

      await act(async () => {
        result.current.fetch(); // first call — in flight
        secondResult = await result.current.fetch(); // second call — ignored immediately
      });

      expect(secondResult).toBeNull();
      // Let the first call complete
      await act(async () => { resolveFirst({ status: 'denied' }); });
    });

    it('resets state back to idle', async () => {
      mockRequestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });

      const { result } = renderHook(() => useCurrentLocation());
      await act(async () => { await result.current.fetch(); });
      expect(result.current.state.status).toBe('denied');

      act(() => { result.current.reset(); });
      expect(result.current.state).toEqual({ status: 'idle' });
    });
  });

  // ── use-trips-data ──────────────────────────────────────────────────────────

  describe('use-trips-data', () => {
    const mockTripResponse = {
      id: 'trip-1',
      driverId: 'driver-1',
      driverFirstName: 'Juan',
      driverLastName: 'Pérez',
      driverMeanRating: 4.5,
      driverTotalTrips: 20,
      driverCreatedAt: '2023-01-15T00:00:00Z',
      vehicleId: 'vehicle-1',
      rate: 1500,
      origin: 'San José',
      destination: 'Cartago',
      originLatitude: 9.9281,
      originLongitude: -84.0907,
      destinationLatitude: 9.8612,
      destinationLongitude: -83.9196,
      departureAt: '2024-01-20T08:00:00Z',
      totalSeats: 4,
      availableSeats: 2,
      state: 'active',
      createdAt: '2024-01-01T00:00:00Z',
      notes: 'Puntual',
    };

    const mockVehicle = {
      vehicleId: 'vehicle-1',
      model: 'Toyota Corolla',
      year: 2020,
      numPlate: 'ABC-123',
      color: 'Blanco',
    };

    beforeEach(() => {
      mockUseAuth.mockReturnValue({ token: 'test-token' });
      mockGet.mockReset();
    });

    it('starts with isLoading=true, trips=null, error=null', () => {
      const { result } = renderHook(() => useTripsData());
      expect(result.current.isLoading).toBe(true);
      expect(result.current.trips).toBeNull();
      expect(result.current.error).toBeNull();
    });

    it('refreshTrips does nothing when there is no token', async () => {
      mockUseAuth.mockReturnValue({ token: null });
      const { result } = renderHook(() => useTripsData());
      await act(async () => { await result.current.refreshTrips(); });
      expect(mockGet).not.toHaveBeenCalled();
      expect(result.current.trips).toBeNull();
    });

    it('fetches and maps trips with vehicle info', async () => {
      mockGet
        .mockResolvedValueOnce([mockTripResponse])
        .mockResolvedValueOnce(mockVehicle);

      const { result } = renderHook(() => useTripsData());
      await act(async () => { await result.current.refreshTrips(); });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.trips).toHaveLength(1);

      const trip = result.current.trips![0];
      expect(trip.id).toBe('trip-1');
      expect(trip.driverName).toBe('Juan Pérez');
      expect(trip.driverId).toBe('driver-1');
      expect(trip.rate).toBe(1500);
      expect(trip.origin).toBe('San José');
      expect(trip.destination).toBe('Cartago');
      expect(trip.totalSeats).toBe(4);
      expect(trip.availableSeats).toBe(2);
      expect(trip.state).toBe(0); // hardcoded in mapTripResponse
      expect(trip.driverRating).toBe(4.5);
      expect(trip.driverTripsCount).toBe(20);
      expect(trip.vehicleModel).toBe('Toyota Corolla');
      expect(trip.vehiclePlate).toBe('ABC-123');
    });

    it('proceeds without vehicle info when vehicle fetch throws', async () => {
      mockGet
        .mockResolvedValueOnce([mockTripResponse])
        .mockRejectedValueOnce(new Error('Not found'));

      const { result } = renderHook(() => useTripsData());
      await act(async () => { await result.current.refreshTrips(); });

      expect(result.current.trips).toHaveLength(1);
      expect(result.current.trips![0].vehicleModel).toBeUndefined();
      expect(result.current.trips![0].vehiclePlate).toBeUndefined();
    });

    it('sets the ApiError message when trips fetch fails with ApiError', async () => {
      mockGet.mockRejectedValueOnce(new MockApiError(401, 'No autorizado'));

      const { result } = renderHook(() => useTripsData());
      await act(async () => { await result.current.refreshTrips(); });

      expect(result.current.error).toBe('No autorizado');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.trips).toBeNull();
    });

    it('sets a generic error message for unknown failures', async () => {
      mockGet.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useTripsData());
      await act(async () => { await result.current.refreshTrips(); });

      expect(result.current.error).toBe('Error desconocido al cargar los viajes');
      expect(result.current.isLoading).toBe(false);
    });

    it('uses fallback driver name when first and last name are both empty', async () => {
      mockGet
        .mockResolvedValueOnce([{ ...mockTripResponse, driverFirstName: '', driverLastName: '' }])
        .mockResolvedValueOnce(null);

      const { result } = renderHook(() => useTripsData());
      await act(async () => { await result.current.refreshTrips(); });

      expect(result.current.trips![0].driverName).toBe('Conductor desconocido');
    });

    it('updateTripAvailableSeats applies delta to the matching trip', async () => {
      mockGet
        .mockResolvedValueOnce([mockTripResponse])
        .mockResolvedValueOnce(mockVehicle);

      const { result } = renderHook(() => useTripsData());
      await act(async () => { await result.current.refreshTrips(); });

      expect(result.current.trips![0].availableSeats).toBe(2);

      act(() => { result.current.updateTripAvailableSeats('trip-1', -1); });
      expect(result.current.trips![0].availableSeats).toBe(1);

      act(() => { result.current.updateTripAvailableSeats('trip-1', 2); });
      expect(result.current.trips![0].availableSeats).toBe(3);
    });

    it('updateTripAvailableSeats does not go below zero', async () => {
      mockGet
        .mockResolvedValueOnce([mockTripResponse])
        .mockResolvedValueOnce(mockVehicle);

      const { result } = renderHook(() => useTripsData());
      await act(async () => { await result.current.refreshTrips(); });

      act(() => { result.current.updateTripAvailableSeats('trip-1', -100); });
      expect(result.current.trips![0].availableSeats).toBe(0);
    });

    it('updateTripAvailableSeats is a no-op when trips is null', () => {
      const { result } = renderHook(() => useTripsData());
      act(() => { result.current.updateTripAvailableSeats('trip-1', 1); });
      expect(result.current.trips).toBeNull();
    });

    it('formatMemberSince produces a localized date string for a valid ISO date', async () => {
      mockGet
        .mockResolvedValueOnce([{ ...mockTripResponse, driverCreatedAt: '2023-01-15T00:00:00Z' }])
        .mockResolvedValueOnce(null);

      const { result } = renderHook(() => useTripsData());
      await act(async () => { await result.current.refreshTrips(); });

      const memberSince = result.current.trips![0].driverMemberSince!;
      expect(typeof memberSince).toBe('string');
      expect(memberSince.length).toBeGreaterThan(0);
      expect(memberSince).not.toBe('2023-01-15T00:00:00Z');
    });

    it('formatMemberSince returns the raw value for an invalid date string', async () => {
      mockGet
        .mockResolvedValueOnce([{ ...mockTripResponse, driverCreatedAt: 'not-a-date' }])
        .mockResolvedValueOnce(null);

      const { result } = renderHook(() => useTripsData());
      await act(async () => { await result.current.refreshTrips(); });

      expect(result.current.trips![0].driverMemberSince).toBe('not-a-date');
    });
  });
});
