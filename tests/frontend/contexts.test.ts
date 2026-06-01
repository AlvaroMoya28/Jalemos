/**
 * @jest-environment jsdom
 */

import { act, renderHook } from '@testing-library/react';
import { createElement } from 'react';

// ── Mocks ──────────────────────────────────────────────────────────────────────
jest.mock('expo-secure-store');

jest.mock('@/contexts/auth', () => ({
  useAuth: jest.fn().mockReturnValue({ token: null, user: null }),
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
  return {
    usersApi: {
      getAll:     jest.fn(),
      changeRole: jest.fn(),
      ban:        jest.fn(),
      liftBan:    jest.fn(),
      deactivate: jest.fn(),
      activate:   jest.fn(),
    },
    applicationsApi: {
      getMy:              jest.fn(),
      submit:             jest.fn(),
      resubmit:           jest.fn(),
      submitVehicle:      jest.fn(),
      getMyVehicles:      jest.fn(),
      getAll:             jest.fn(),
      setUnderReview:     jest.fn().mockResolvedValue(undefined),
      requestCorrection:  jest.fn().mockResolvedValue(undefined),
      approve:            jest.fn().mockResolvedValue(undefined),
      reject:             jest.fn().mockResolvedValue(undefined),
    },
    ApiError,
  };
});

jest.mock('@/constants/mock-reports', () => ({
  SEED_REPORTS: [],
}));

// ── Mock references ────────────────────────────────────────────────────────────
const secureMock = jest.requireMock('expo-secure-store') as {
  getItemAsync: jest.Mock;
  setItemAsync: jest.Mock;
  deleteItemAsync: jest.Mock;
};

const authCtxMock = jest.requireMock('@/contexts/auth') as { useAuth: jest.Mock };

const apiMock = jest.requireMock('@/services/api') as {
  usersApi: {
    getAll: jest.Mock; changeRole: jest.Mock; ban: jest.Mock;
    liftBan: jest.Mock; deactivate: jest.Mock; activate: jest.Mock;
  };
  applicationsApi: {
    getMy: jest.Mock; submit: jest.Mock; resubmit: jest.Mock;
    submitVehicle: jest.Mock; getMyVehicles: jest.Mock; getAll: jest.Mock;
    setUnderReview: jest.Mock; requestCorrection: jest.Mock;
    approve: jest.Mock; reject: jest.Mock;
  };
};

// ── Contexts under test ────────────────────────────────────────────────────────
const { AdminUsersProvider, useAdminUsers } = require('../../FrontEnd/contexts/admin-users');
const { UserModeProvider, useUserMode }     = require('../../FrontEnd/contexts/user-mode');
const { ApplicationsProvider, useApplications } = require('../../FrontEnd/contexts/applications');

// ── Test data helpers ──────────────────────────────────────────────────────────
const makeUserDTO = (overrides = {}) => ({
  id: 'u1', firstName: 'Juan', lastName: 'Pérez',
  email: 'j@test.com', role: 'passenger', isActive: true,
  suspendedUntil: null, rating: 4.5, tripsCount: 5,
  ...overrides,
});

const makePagedResponse = (users: any[], overrides = {}) => ({
  users,
  totalCount: users.length,
  page: 1,
  pageSize: 30,
  totalPages: 1,
  ...overrides,
});

const makeDTO = (overrides = {}) => ({
  applicationId: 'app-1', userId: 'u1',
  applicantName: 'Juan Pérez', applicantEmail: 'j@test.com', applicantAvatar: 'JP',
  submittedAt: '2024-01-01T00:00:00Z', updatedAt: '2024-01-01T00:00:00Z',
  status: 'pending', applicationType: 'driver', attempts: 1,
  cedula: '11111111', address: 'San José',
  vehicleBrand: 'Toyota', vehicleModel: 'Corolla', vehicleYear: 2020,
  vehiclePlate: 'ABC-123', vehicleColor: 'Blanco',
  facePhoto: null, licensePhotoFront: null, licensePhotoBack: null, dekraPhoto: null,
  licenseExpiryMonth: null, licenseExpiryYear: null,
  dekraExpiryMonth: null, dekraExpiryYear: null,
  isRenewal: false, adminIssueIds: null, adminNotes: null, reviewedAt: null,
  ...overrides,
});

// ═══════════════════════════════════════════════════════════════════════════════
// AdminUsersProvider
// ═══════════════════════════════════════════════════════════════════════════════

describe('FrontEnd contexts/admin-users — AdminUsersProvider', () => {
  const wrapper = ({ children }: { children: any }) =>
    createElement(AdminUsersProvider, null, children);

  beforeEach(() => {
    authCtxMock.useAuth.mockReturnValue({ token: 'admin-token' });
    apiMock.usersApi.getAll.mockReset();
  });

  it('starts with empty users list and no loading state', () => {
    const { result } = renderHook(() => useAdminUsers(), { wrapper });
    expect(result.current.users).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.totalCount).toBe(0);
  });

  it('loadUsers does nothing when there is no token', async () => {
    authCtxMock.useAuth.mockReturnValue({ token: null });
    const { result } = renderHook(() => useAdminUsers(), { wrapper });
    await act(async () => { await result.current.loadUsers(); });
    expect(apiMock.usersApi.getAll).not.toHaveBeenCalled();
  });

  it('loadUsers fetches users and maps them to AdminUser', async () => {
    const dto = makeUserDTO();
    apiMock.usersApi.getAll.mockResolvedValue(makePagedResponse([dto]));

    const { result } = renderHook(() => useAdminUsers(), { wrapper });
    await act(async () => { await result.current.loadUsers(); });

    expect(result.current.loading).toBe(false);
    expect(result.current.users).toHaveLength(1);
    expect(result.current.users[0].email).toBe('j@test.com');
    expect(result.current.users[0].avatar).toBe('JP'); // initials
    expect(result.current.users[0].displayStatus).toBe('active');
    expect(result.current.totalCount).toBe(1);
    expect(result.current.totalPages).toBe(1);
  });

  it('computeStatus returns deactivated when isActive is false', async () => {
    apiMock.usersApi.getAll.mockResolvedValue(
      makePagedResponse([makeUserDTO({ isActive: false })]),
    );
    const { result } = renderHook(() => useAdminUsers(), { wrapper });
    await act(async () => { await result.current.loadUsers(); });
    expect(result.current.users[0].displayStatus).toBe('deactivated');
  });

  it('computeStatus returns suspended when suspendedUntil is in the future', async () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    apiMock.usersApi.getAll.mockResolvedValue(
      makePagedResponse([makeUserDTO({ suspendedUntil: future })]),
    );
    const { result } = renderHook(() => useAdminUsers(), { wrapper });
    await act(async () => { await result.current.loadUsers(); });
    expect(result.current.users[0].displayStatus).toBe('suspended');
  });

  it('loadUsers sets error on failure', async () => {
    apiMock.usersApi.getAll.mockRejectedValue(new Error('Server error'));
    const { result } = renderHook(() => useAdminUsers(), { wrapper });
    await act(async () => { await result.current.loadUsers(); });
    expect(result.current.error).toBe('Server error');
    expect(result.current.loading).toBe(false);
  });

  it('setFilters resets page to 1 when a non-page filter changes', () => {
    const { result } = renderHook(() => useAdminUsers(), { wrapper });
    act(() => { result.current.setFilters({ page: 3 }); });
    expect(result.current.filters.page).toBe(3);
    act(() => { result.current.setFilters({ search: 'ana' }); }); // non-page change → resets page
    expect(result.current.filters.page).toBe(1);
    expect(result.current.filters.search).toBe('ana');
  });

  it('setFilters keeps page when only page changes', () => {
    const { result } = renderHook(() => useAdminUsers(), { wrapper });
    act(() => { result.current.setFilters({ page: 5 }); });
    expect(result.current.filters.page).toBe(5);
  });

  it('loadUsers builds query params from filters', async () => {
    apiMock.usersApi.getAll.mockResolvedValue(makePagedResponse([]));
    const { result } = renderHook(() => useAdminUsers(), { wrapper });

    act(() => { result.current.setFilters({ search: 'bob', role: 'driver', status: 'active' }); });
    await act(async () => { await result.current.loadUsers(); });

    expect(apiMock.usersApi.getAll).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'bob', role: 'driver', status: 'active' }),
      'admin-token',
    );
  });

  it.each([
    ['changeRole', (r: any) => r.changeRole('u1', 'driver')],
    ['ban',        (r: any) => r.ban('u1', 7)],
    ['liftBan',    (r: any) => r.liftBan('u1')],
    ['deactivate', (r: any) => r.deactivate('u1')],
    ['activate',   (r: any) => r.activate('u1')],
  ])('%s calls usersApi and then reloads users', async (action, invoke) => {
    apiMock.usersApi[action as keyof typeof apiMock.usersApi] =
      jest.fn().mockResolvedValue(undefined);
    apiMock.usersApi.getAll.mockResolvedValue(makePagedResponse([]));

    const { result } = renderHook(() => useAdminUsers(), { wrapper });
    await act(async () => { await invoke(result.current); });

    expect(apiMock.usersApi.getAll).toHaveBeenCalled();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// UserModeProvider
// ═══════════════════════════════════════════════════════════════════════════════

describe('FrontEnd contexts/user-mode — UserModeProvider', () => {
  const wrapper = ({ children }: { children: any }) =>
    createElement(UserModeProvider, null, children);

  beforeEach(() => {
    secureMock.getItemAsync.mockResolvedValue(null);
    authCtxMock.useAuth.mockReturnValue({ token: null, user: null });
  });

  it('starts with passenger mode and no driver registration', () => {
    const { result } = renderHook(() => useUserMode(), { wrapper });
    expect(result.current.mode).toBe('passenger');
    expect(result.current.isDriverRegistered).toBe(false);
    expect(result.current.profilePhoto).toBeNull();
  });

  it('resets to passenger mode when user is null', async () => {
    authCtxMock.useAuth.mockReturnValue({ user: null });
    const { result } = renderHook(() => useUserMode(), { wrapper });
    await act(async () => {});
    expect(result.current.mode).toBe('passenger');
  });

  it('forces passenger mode for admin role', async () => {
    authCtxMock.useAuth.mockReturnValue({ user: { id: 'u1', role: 'admin' } });
    const { result } = renderHook(() => useUserMode(), { wrapper });
    await act(async () => {});
    expect(result.current.mode).toBe('passenger');
    expect(result.current.isDriverRegistered).toBe(false);
  });

  it('forces passenger mode for passenger role', async () => {
    authCtxMock.useAuth.mockReturnValue({ user: { id: 'u1', role: 'passenger' } });
    const { result } = renderHook(() => useUserMode(), { wrapper });
    await act(async () => {});
    expect(result.current.mode).toBe('passenger');
    expect(result.current.isDriverRegistered).toBe(false);
  });

  it('sets isDriverRegistered=true for passenger+driver role and defaults to passenger', async () => {
    secureMock.getItemAsync.mockResolvedValue(null);
    authCtxMock.useAuth.mockReturnValue({ user: { id: 'u1', role: 'passenger+driver' } });
    const { result } = renderHook(() => useUserMode(), { wrapper });
    await act(async () => {});
    expect(result.current.isDriverRegistered).toBe(true);
    expect(result.current.mode).toBe('passenger');
  });

  it('restores driver mode from SecureStore for passenger+driver', async () => {
    secureMock.getItemAsync.mockResolvedValue('driver');
    authCtxMock.useAuth.mockReturnValue({ user: { id: 'u1', role: 'passenger+driver' } });
    const { result } = renderHook(() => useUserMode(), { wrapper });
    await act(async () => {});
    expect(result.current.mode).toBe('driver');
  });

  it('setMode updates state and persists to SecureStore', async () => {
    authCtxMock.useAuth.mockReturnValue({ user: { id: 'u1', role: 'passenger+driver' } });
    const { result } = renderHook(() => useUserMode(), { wrapper });
    await act(async () => {});

    act(() => { result.current.setMode('driver'); });

    expect(result.current.mode).toBe('driver');
    expect(secureMock.setItemAsync).toHaveBeenCalledWith('jalemos_mode_u1', 'driver');
  });

  it('setDriverRegistered updates the flag', () => {
    const { result } = renderHook(() => useUserMode(), { wrapper });
    act(() => { result.current.setDriverRegistered(true); });
    expect(result.current.isDriverRegistered).toBe(true);
  });

  it('setProfilePhoto updates the URI', () => {
    const { result } = renderHook(() => useUserMode(), { wrapper });
    act(() => { result.current.setProfilePhoto('file://photo.jpg'); });
    expect(result.current.profilePhoto).toBe('file://photo.jpg');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// ApplicationsProvider
// ═══════════════════════════════════════════════════════════════════════════════

describe('FrontEnd contexts/applications — ApplicationsProvider', () => {
  const wrapper = ({ children }: { children: any }) =>
    createElement(ApplicationsProvider, null, children);

  beforeEach(() => {
    authCtxMock.useAuth.mockReturnValue({ token: 'tok', user: null });
    Object.values(apiMock.applicationsApi).forEach(m => (m as jest.Mock).mockReset());
  });

  it('starts with null myApplication and empty lists', () => {
    const { result } = renderHook(() => useApplications(), { wrapper });
    expect(result.current.myApplication).toBeNull();
    expect(result.current.myApplicationLoading).toBe(false);
    expect(result.current.applications).toEqual([]);
    expect(result.current.reports).toEqual([]);
  });

  it('loadMyApplication returns and stores the mapped application', async () => {
    const dto = makeDTO();
    apiMock.applicationsApi.getMy.mockResolvedValue(dto);

    const { result } = renderHook(() => useApplications(), { wrapper });
    let app: any;
    await act(async () => { app = await result.current.loadMyApplication(); });

    expect(app).not.toBeNull();
    expect(app.id).toBe('app-1');
    expect(app.applicantName).toBe('Juan Pérez');
    expect(app.vehicle).toEqual({ brand: 'Toyota', model: 'Corolla', year: '2020', plate: 'ABC-123', color: 'Blanco' });
    expect(result.current.myApplication?.id).toBe('app-1');
    expect(result.current.myApplicationLoading).toBe(false);
  });

  it('loadMyApplication stores null when the API returns null', async () => {
    apiMock.applicationsApi.getMy.mockResolvedValue(null);
    const { result } = renderHook(() => useApplications(), { wrapper });
    let app: any;
    await act(async () => { app = await result.current.loadMyApplication(); });
    expect(app).toBeNull();
    expect(result.current.myApplication).toBeNull();
  });

  it('submitApplication maps the DTO and updates myApplication', async () => {
    const dto = makeDTO({ status: 'pending' });
    apiMock.applicationsApi.submit.mockResolvedValue(dto);

    const { result } = renderHook(() => useApplications(), { wrapper });
    let app: any;
    await act(async () => {
      app = await result.current.submitApplication({
        facePhoto: null, licensePhotoFront: null, licensePhotoBack: null,
        dekraPhoto: null, licenseExpiryMonth: null, licenseExpiryYear: null,
        dekraExpiryMonth: null, dekraExpiryYear: null,
      });
    });

    expect(app.id).toBe('app-1');
    expect(result.current.myApplication?.id).toBe('app-1');
  });

  it('resubmitApplication updates myApplication', async () => {
    const dto = makeDTO({ status: 'needs_correction', attempts: 2 });
    apiMock.applicationsApi.resubmit.mockResolvedValue(dto);

    const { result } = renderHook(() => useApplications(), { wrapper });
    await act(async () => {
      await result.current.resubmitApplication('app-1', {
        facePhoto: null, licensePhotoFront: null, licensePhotoBack: null,
        dekraPhoto: null, licenseExpiryMonth: null, licenseExpiryYear: null,
        dekraExpiryMonth: null, dekraExpiryYear: null,
      });
    });

    expect(result.current.myApplication?.attempts).toBe(2);
  });

  it('loadApplications fetches and maps the admin list', async () => {
    const dto = makeDTO();
    apiMock.applicationsApi.getAll.mockResolvedValue([dto]);

    const { result } = renderHook(() => useApplications(), { wrapper });
    await act(async () => { await result.current.loadApplications(); });

    expect(result.current.applications).toHaveLength(1);
    expect(result.current.applications[0].id).toBe('app-1');
    expect(result.current.applicationsLoading).toBe(false);
  });

  it('setUnderReview applies an optimistic status update', async () => {
    apiMock.applicationsApi.getAll.mockResolvedValue([makeDTO({ status: 'pending' })]);
    apiMock.applicationsApi.setUnderReview.mockResolvedValue(undefined);

    const { result } = renderHook(() => useApplications(), { wrapper });
    await act(async () => { await result.current.loadApplications(); });
    await act(async () => { await result.current.setUnderReview('app-1'); });

    expect(result.current.applications[0].status).toBe('under_review');
  });

  it('requestCorrection applies an optimistic status update', async () => {
    apiMock.applicationsApi.getAll.mockResolvedValue([makeDTO()]);
    apiMock.applicationsApi.requestCorrection.mockResolvedValue(undefined);

    const { result } = renderHook(() => useApplications(), { wrapper });
    await act(async () => { await result.current.loadApplications(); });
    await act(async () => {
      await result.current.requestCorrection('app-1', ['bad_photo'], 'Foto borrosa');
    });

    expect(result.current.applications[0].status).toBe('needs_correction');
    expect(result.current.applications[0].adminFeedback?.notes).toBe('Foto borrosa');
  });

  it('approveApplication applies an optimistic status update', async () => {
    apiMock.applicationsApi.getAll.mockResolvedValue([makeDTO()]);
    apiMock.applicationsApi.approve.mockResolvedValue(undefined);

    const { result } = renderHook(() => useApplications(), { wrapper });
    await act(async () => { await result.current.loadApplications(); });
    await act(async () => { await result.current.approveApplication('app-1'); });

    expect(result.current.applications[0].status).toBe('approved');
  });

  it('rejectApplication applies an optimistic status update', async () => {
    apiMock.applicationsApi.getAll.mockResolvedValue([makeDTO()]);
    apiMock.applicationsApi.reject.mockResolvedValue(undefined);

    const { result } = renderHook(() => useApplications(), { wrapper });
    await act(async () => { await result.current.loadApplications(); });
    await act(async () => {
      await result.current.rejectApplication('app-1', ['fake_docs'], 'Documentos falsos');
    });

    expect(result.current.applications[0].status).toBe('rejected');
    expect(result.current.applications[0].adminFeedback?.notes).toBe('Documentos falsos');
  });

  describe('report actions (in-memory)', () => {
    beforeEach(() => {
      jest.requireMock('@/constants/mock-reports').SEED_REPORTS = [
        { id: 'r1', status: 'pending', adminAction: undefined },
      ];
    });

    it('suspendUserFromReport marks the report as resolved with suspended action', () => {
      const { result } = renderHook(() => useApplications(), { wrapper });
      act(() => { result.current.suspendUserFromReport('r1', 3); });
      expect(result.current.reports[0].status).toBe('resolved');
      expect(result.current.reports[0].adminAction?.type).toBe('suspended');
    });

    it('deactivateUserFromReport marks the report as resolved with deactivated action', () => {
      const { result } = renderHook(() => useApplications(), { wrapper });
      act(() => { result.current.deactivateUserFromReport('r1'); });
      expect(result.current.reports[0].status).toBe('resolved');
      expect(result.current.reports[0].adminAction?.type).toBe('deactivated');
    });

    it('dismissReport marks the report as dismissed', () => {
      const { result } = renderHook(() => useApplications(), { wrapper });
      act(() => { result.current.dismissReport('r1'); });
      expect(result.current.reports[0].status).toBe('dismissed');
      expect(result.current.reports[0].adminAction?.type).toBe('dismissed');
    });
  });
});
