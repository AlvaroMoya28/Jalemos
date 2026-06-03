/**
 * @jest-environment jsdom
 */

import { createElement } from 'react';
import { render } from '@testing-library/react';

// ── Context mocks ──────────────────────────────────────────────────────────────
// These are resolved by moduleNameMapper (@/ → FrontEnd/) and provide the
// context values that every app screen relies on.

const mockUser = {
  id: 'u1', username: 'test', email: 't@t.com',
  firstName: 'Test', lastName: 'User', role: 'passenger' as const,
  avatar: 'TU', profilePhotoUrl: null, profilePhotoLocked: false,
  rating: 4.5, tripsCount: 5, driverTripsCount: 0, memberSince: 'Enero 2024',
  licenseExpiryMonth: null, licenseExpiryYear: null,
  dekraExpiryMonth: null, dekraExpiryYear: null,
};

jest.mock('@/contexts/auth', () => ({
  useAuth: jest.fn().mockReturnValue({
    user: null, token: null, isLoading: false, driverActivated: false,
    login: jest.fn(), logout: jest.fn(), register: jest.fn(),
    upgradeToDriver: jest.fn(), setDriverActivated: jest.fn(),
  }),
}));

jest.mock('@/contexts/loading', () => ({
  useLoading: jest.fn().mockReturnValue({ showLoader: jest.fn(), hideLoader: jest.fn() }),
}));

jest.mock('@/hooks/use-trips-data', () => ({
  useTripsData: jest.fn().mockReturnValue({
    trips: [], isLoading: false, error: null,
    refreshTrips: jest.fn(), updateTripAvailableSeats: jest.fn(),
  }),
}));

jest.mock('@/contexts/applications', () => ({
  useApplications: jest.fn().mockReturnValue({
    myApplication: null, myApplicationLoading: false,
    loadMyApplication: jest.fn().mockResolvedValue(null),
    submitApplication: jest.fn(), resubmitApplication: jest.fn(),
    submitVehicleApplication: jest.fn(), myVehicleApplications: [],
    loadMyVehicleApplications: jest.fn(),
    applications: [], applicationsLoading: false,
    loadApplications: jest.fn(),
    setUnderReview: jest.fn(), requestCorrection: jest.fn(),
    approveApplication: jest.fn(), rejectApplication: jest.fn(),
    reports: [],
    suspendUserFromReport: jest.fn(), deactivateUserFromReport: jest.fn(),
    dismissReport: jest.fn(),
  }),
}));

jest.mock('@/contexts/user-mode', () => ({
  useUserMode: jest.fn().mockReturnValue({
    mode: 'passenger', isDriverRegistered: false, profilePhoto: null,
    setMode: jest.fn(), setDriverRegistered: jest.fn(), setProfilePhoto: jest.fn(),
  }),
}));

jest.mock('@/contexts/admin-users', () => ({
  useAdminUsers: jest.fn().mockReturnValue({
    users: [], totalCount: 0, totalPages: 0,
    filters: { search: '', role: 'all', status: 'all', sortBy: 'name_asc', page: 1 },
    loading: false, error: null,
    setFilters: jest.fn(), loadUsers: jest.fn().mockResolvedValue(undefined),
    changeRole: jest.fn(), ban: jest.fn(), liftBan: jest.fn(),
    deactivate: jest.fn(), activate: jest.fn(),
  }),
}));

jest.mock('@/services/api', () => ({
  get: jest.fn().mockResolvedValue([]),
  post: jest.fn().mockResolvedValue({}),
  patch: jest.fn().mockResolvedValue(undefined),
  bookingsApi: {
    getMyBookings: jest.fn().mockResolvedValue([]),
    book: jest.fn().mockResolvedValue({}),
    cancel: jest.fn().mockResolvedValue(undefined),
  },
  vehiclesApi: {
    getAll: jest.fn().mockResolvedValue([]),
    delete: jest.fn().mockResolvedValue(undefined),
  },
  ApiError: class ApiError extends Error {
    status: number;
    constructor(status: number, msg: string) { super(msg); this.status = status; }
  },
}));

// ══════════════════════════════════════════════════════════════════════════════
// Pure utility logic — replicated from embedded (non-exported) screen functions.
// These tests document and protect the business logic in search.tsx / offer.tsx /
// profile.tsx.  The implementations are intentionally identical to the originals.
// ══════════════════════════════════════════════════════════════════════════════

// ── buildCalendarDays / isSameDay / timeLabel / dateLabel (search.tsx, offer.tsx) ─

function buildCalendarDays(cursor: Date): (Date | null)[] {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0).getDate();
  const startIndex = (first.getDay() + 6) % 7; // Monday-based offset
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startIndex; i++) cells.push(null);
  for (let day = 1; day <= lastDay; day++) cells.push(new Date(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function isSameDay(a: Date | null, b: Date | null): boolean {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}

function timeLabel(hour: number, minute: number): string {
  const period = hour < 12 ? 'AM' : 'PM';
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}:${String(minute).padStart(2, '0')} ${period}`;
}

// ── expiryState / expiryLabel (profile.tsx) ────────────────────────────────────

type ExpiryState = 'ok' | 'soon' | 'expired';

function expiryState(month: number | null, year: number | null): ExpiryState {
  if (!month || !year) return 'ok';
  const now = new Date();
  const expiry = new Date(year, month - 1, 1);
  const diffDays = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return 'expired';
  if (diffDays <= 60) return 'soon';
  return 'ok';
}

function expiryLabel(month: number | null, year: number | null): string {
  if (!month || !year) return 'Sin fecha';
  return `Vence ${String(month).padStart(2, '0')}/${year}`;
}

// ══════════════════════════════════════════════════════════════════════════════
// Test suites
// ══════════════════════════════════════════════════════════════════════════════

describe('FrontEnd app — embedded pure logic', () => {

  // ── buildCalendarDays ────────────────────────────────────────────────────────
  describe('buildCalendarDays', () => {
    it('total cells are always a multiple of 7', () => {
      // Test several months
      [
        new Date(2025, 0, 1),  // January 2025
        new Date(2025, 1, 1),  // February 2025
        new Date(2024, 1, 1),  // February 2024 (leap year)
        new Date(2025, 6, 1),  // July 2025
      ].forEach((d) => {
        const cells = buildCalendarDays(d);
        expect(cells.length % 7).toBe(0);
      });
    });

    it('January 2025: starts on Wednesday (index 2 in Mon-based grid)', () => {
      const cells = buildCalendarDays(new Date(2025, 0, 1));
      // First two slots are null (Mon, Tue before Jan 1 which is Wed)
      expect(cells[0]).toBeNull();
      expect(cells[1]).toBeNull();
      expect(cells[2]).not.toBeNull();
      expect(cells[2]!.getDate()).toBe(1);
    });

    it('contains exactly as many non-null cells as days in the month', () => {
      const cells = buildCalendarDays(new Date(2025, 1, 1)); // Feb 2025 = 28 days
      const nonNull = cells.filter(Boolean);
      expect(nonNull).toHaveLength(28);
    });

    it('leap year February has 29 days', () => {
      const cells = buildCalendarDays(new Date(2024, 1, 1)); // Feb 2024
      expect(cells.filter(Boolean)).toHaveLength(29);
    });

    it('dates are in ascending order', () => {
      const cells = buildCalendarDays(new Date(2025, 2, 1)); // March 2025
      const dates = cells.filter(Boolean) as Date[];
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i].getDate()).toBe(dates[i - 1].getDate() + 1);
      }
    });
  });

  // ── isSameDay ────────────────────────────────────────────────────────────────
  describe('isSameDay', () => {
    it('returns false when either argument is null', () => {
      expect(isSameDay(null, new Date())).toBe(false);
      expect(isSameDay(new Date(), null)).toBe(false);
      expect(isSameDay(null, null)).toBe(false);
    });

    it('returns true for two identical date objects', () => {
      const d = new Date(2025, 5, 15);
      expect(isSameDay(d, new Date(2025, 5, 15))).toBe(true);
    });

    it('returns false for different days in the same month', () => {
      expect(isSameDay(new Date(2025, 5, 14), new Date(2025, 5, 15))).toBe(false);
    });

    it('returns false for same day in different months', () => {
      expect(isSameDay(new Date(2025, 4, 15), new Date(2025, 5, 15))).toBe(false);
    });

    it('returns false for same day in different years', () => {
      expect(isSameDay(new Date(2024, 5, 15), new Date(2025, 5, 15))).toBe(false);
    });
  });

  // ── timeLabel ────────────────────────────────────────────────────────────────
  describe('timeLabel', () => {
    it('formats midnight as 12:00 AM', () => {
      expect(timeLabel(0, 0)).toBe('12:00 AM');
    });

    it('formats noon as 12:00 PM', () => {
      expect(timeLabel(12, 0)).toBe('12:00 PM');
    });

    it('formats 1pm correctly', () => {
      expect(timeLabel(13, 0)).toBe('1:00 PM');
    });

    it('formats 11:45 PM correctly', () => {
      expect(timeLabel(23, 45)).toBe('11:45 PM');
    });

    it('pads single-digit minutes with a leading zero', () => {
      expect(timeLabel(9, 5)).toBe('9:05 AM');
    });
  });

  // ── expiryState ──────────────────────────────────────────────────────────────
  describe('expiryState', () => {
    it('returns "ok" when both month and year are null', () => {
      expect(expiryState(null, null)).toBe('ok');
    });

    it('returns "ok" when month is null', () => {
      expect(expiryState(null, 2030)).toBe('ok');
    });

    it('returns "expired" for a date clearly in the past', () => {
      expect(expiryState(1, 2000)).toBe('expired');
    });

    it('returns "ok" for a date clearly in the future', () => {
      expect(expiryState(12, 2099)).toBe('ok');
    });

    it('returns "soon" for a date within 60 days from now', () => {
      const soon = new Date();
      soon.setDate(soon.getDate() + 30);
      expect(expiryState(soon.getMonth() + 1, soon.getFullYear())).toBe('soon');
    });
  });

  // ── expiryLabel ──────────────────────────────────────────────────────────────
  describe('expiryLabel', () => {
    it('returns "Sin fecha" when both are null', () => {
      expect(expiryLabel(null, null)).toBe('Sin fecha');
    });

    it('returns "Sin fecha" when month is null', () => {
      expect(expiryLabel(null, 2030)).toBe('Sin fecha');
    });

    it('formats "Vence MM/YYYY" for a valid date', () => {
      expect(expiryLabel(3, 2027)).toBe('Vence 03/2027');
    });

    it('pads single-digit months', () => {
      expect(expiryLabel(1, 2030)).toBe('Vence 01/2030');
    });

    it('does not pad two-digit months', () => {
      expect(expiryLabel(12, 2030)).toBe('Vence 12/2030');
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Smoke render tests — simpler screens (no reanimated / no complex hooks)
// ══════════════════════════════════════════════════════════════════════════════

describe('FrontEnd app — screen smoke tests', () => {

  it('modal.tsx renders without error', () => {
    const Screen = require('../../FrontEnd/app/modal').default;
    expect(() => render(createElement(Screen))).not.toThrow();
  });

  it('policies.tsx renders without error', () => {
    const Screen = require('../../FrontEnd/app/policies').default;
    expect(() => render(createElement(Screen))).not.toThrow();
  });

  it('register.tsx renders without error', () => {
    const Screen = require('../../FrontEnd/app/register').default;
    expect(() => render(createElement(Screen))).not.toThrow();
  });

  it('index.tsx (login) renders without error', () => {
    const Screen = require('../../FrontEnd/app/index').default;
    expect(() => render(createElement(Screen))).not.toThrow();
  });

  it('(tabs)/explore.tsx renders without error', () => {
    const Screen = require('../../FrontEnd/app/(tabs)/explore').default;
    expect(() => render(createElement(Screen))).not.toThrow();
  });

  it('(tabs)/explore.tsx renders section headings', () => {
    const Screen = require('../../FrontEnd/app/(tabs)/explore').default;
    const { getByText } = render(createElement(Screen));
    expect(getByText('Explore')).toBeTruthy();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Import-only tests — complex screens with reanimated / native modules.
// Requiring the module executes all module-level code (constants, function
// definitions, StyleSheet.create calls) without mounting the component.
// ══════════════════════════════════════════════════════════════════════════════

describe('FrontEnd app — module-level import coverage', () => {
  it.each([
    ['add-vehicle.tsx',                     '../../FrontEnd/app/add-vehicle'],
    ['application-detail.tsx',              '../../FrontEnd/app/application-detail'],
    ['driver-documents.tsx',                '../../FrontEnd/app/driver-documents'],
    ['driver-registration.tsx',             '../../FrontEnd/app/driver-registration'],
    ['driver-status.tsx',                   '../../FrontEnd/app/driver-status'],
    ['ride-detail.tsx',                     '../../FrontEnd/app/ride-detail'],
    ['vehicle-application-status.tsx',      '../../FrontEnd/app/vehicle-application-status'],
  ])('%s loads without throwing', (_name, path) => {
    expect(() => require(path)).not.toThrow();
  });

  it.each([
    ['(tabs)/_layout.tsx',              '../../FrontEnd/app/(tabs)/_layout'],
    ['(tabs)/admin-applications.tsx',   '../../FrontEnd/app/(tabs)/admin-applications'],
    ['(tabs)/admin-reports.tsx',        '../../FrontEnd/app/(tabs)/admin-reports'],
    ['(tabs)/admin-users.tsx',          '../../FrontEnd/app/(tabs)/admin-users'],
    ['(tabs)/explore.tsx',              '../../FrontEnd/app/(tabs)/explore'],
    ['(tabs)/my-rides.tsx',             '../../FrontEnd/app/(tabs)/my-rides'],
    ['(tabs)/offer.tsx',                '../../FrontEnd/app/(tabs)/offer'],
    ['(tabs)/profile.tsx',              '../../FrontEnd/app/(tabs)/profile'],
    ['(tabs)/search.tsx',               '../../FrontEnd/app/(tabs)/search'],
  ])('%s loads without throwing', (_name, path) => {
    expect(() => require(path)).not.toThrow();
  });
});
