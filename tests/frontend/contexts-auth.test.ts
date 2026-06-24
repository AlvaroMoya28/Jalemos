/**
 * @jest-environment jsdom
 */

import { act, renderHook } from '@testing-library/react';
import { createElement } from 'react';

// ── Mocks ──────────────────────────────────────────────────────────────────────
// expo-secure-store is redirected to __stubs__ via moduleNameMapper.
// We still need jest.mock so clearMocks resets call counts between tests.
jest.mock('expo-secure-store');

jest.mock('@/services/api', () => {
  class ApiError extends Error {
    status: number;
    constructor(status: number, message: string) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
    }
  }
  return { get: jest.fn(), post: jest.fn(), patch: jest.fn(), ApiError };
});

// ── Mock references ────────────────────────────────────────────────────────────
const secureMock = jest.requireMock('expo-secure-store') as {
  getItemAsync: jest.Mock;
  setItemAsync: jest.Mock;
  deleteItemAsync: jest.Mock;
};

const apiMock = jest.requireMock('@/services/api') as {
  get: jest.Mock;
  post: jest.Mock;
  patch: jest.Mock;
  ApiError: new (status: number, msg: string) => Error & { status: number };
};

// ── Module under test ──────────────────────────────────────────────────────────
const { AuthProvider, useAuth } = require('../../FrontEnd/contexts/auth');

// ── Helpers ────────────────────────────────────────────────────────────────────
const wrapper = ({ children }: { children: any }) =>
  createElement(AuthProvider, null, children);

const authHook = () => renderHook(() => useAuth(), { wrapper });

/** Waits for the initial useEffect (session restore) to settle. */
const waitForLoad = async (hook: ReturnType<typeof authHook>) => {
  await act(async () => {});
  return hook;
};

const makeAuthResponse = (overrides = {}) => ({
  token: 'new-jwt',
  id: 'u1',
  username: 'jperez',
  email: 'j@test.com',
  firstName: 'Juan',
  lastName: 'Pérez',
  role: 'passenger',
  avatar: 'JP',
  profilePhotoUrl: null,
  profilePhotoLocked: false,
  rating: 4.5,
  tripsCount: 10,
  driverTripsCount: 0,
  memberSince: '2023-01',
  licenseExpiryMonth: null,
  licenseExpiryYear: null,
  dekraExpiryMonth: null,
  dekraExpiryYear: null,
  ...overrides,
});

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('FrontEnd contexts/auth — AuthProvider', () => {

  describe('session restore on mount', () => {
    it('starts in loading state before SecureStore resolves', () => {
      secureMock.getItemAsync.mockReturnValue(new Promise(() => {})); // never resolves
      const { result } = authHook();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });

    it('finishes loading with no user when no token is stored', async () => {
      secureMock.getItemAsync.mockResolvedValue(null);
      const { result } = await waitForLoad(authHook());
      expect(result.current.isLoading).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.token).toBeNull();
    });

    it('restores session when stored token refreshes successfully', async () => {
      secureMock.getItemAsync.mockResolvedValueOnce('stored-jwt').mockResolvedValueOnce(null);
      apiMock.get.mockResolvedValue(makeAuthResponse({ token: 'refreshed-jwt', role: 'passenger' }));

      const { result } = await waitForLoad(authHook());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.token).toBe('refreshed-jwt');
      expect(result.current.user?.username).toBe('jperez');
      expect(result.current.user?.role).toBe('passenger');
    });

    it('sets driverActivated=true when role is passenger+driver and flag is stored', async () => {
      secureMock.getItemAsync
        .mockResolvedValueOnce('stored-jwt')
        .mockResolvedValueOnce('1'); // DRIVER_ACTIVATED_KEY
      apiMock.get.mockResolvedValue(makeAuthResponse({ role: 'passenger+driver' }));

      const { result } = await waitForLoad(authHook());
      expect(result.current.driverActivated).toBe(true);
    });

    it('falls back to stored token when the refresh API call fails', async () => {
      secureMock.getItemAsync.mockResolvedValueOnce('fallback-jwt').mockResolvedValueOnce(null);
      apiMock.get.mockRejectedValue(new Error('Network error'));

      const { result } = await waitForLoad(authHook());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.token).toBe('fallback-jwt');
      expect(result.current.user).toBeNull();
    });
  });

  describe('login', () => {
    beforeEach(() => {
      secureMock.getItemAsync.mockResolvedValue(null); // no stored session
    });

    it('sets user and token on success', async () => {
      apiMock.post.mockResolvedValue(makeAuthResponse({ token: 'login-jwt', role: 'passenger' }));
      secureMock.getItemAsync.mockResolvedValue(null); // for driverActivated check inside login

      const { result } = await waitForLoad(authHook());

      await act(async () => {
        const res = await result.current.login('jperez', 'pass');
        expect(res.success).toBe(true);
        expect(res.user?.username).toBe('jperez');
      });

      expect(result.current.token).toBe('login-jwt');
      expect(result.current.user?.role).toBe('passenger');
    });

    it('returns error message from ApiError on failure', async () => {
      apiMock.post.mockRejectedValue(new apiMock.ApiError(401, 'Credenciales inválidas'));

      const { result } = await waitForLoad(authHook());

      let res: any;
      await act(async () => { res = await result.current.login('x', 'y'); });

      expect(res.success).toBe(false);
      expect(res.error).toBe('Credenciales inválidas');
      expect(result.current.user).toBeNull();
    });

    it('returns generic message on network error', async () => {
      apiMock.post.mockRejectedValue(new Error('timeout'));

      const { result } = await waitForLoad(authHook());

      let res: any;
      await act(async () => { res = await result.current.login('x', 'y'); });

      expect(res.success).toBe(false);
      expect(res.error).toBe('Error de conexión con el servidor');
    });
  });

  describe('logout', () => {
    it('clears user, token, and driverActivated', async () => {
      secureMock.getItemAsync.mockResolvedValueOnce('stored-jwt').mockResolvedValue(null);
      apiMock.get.mockResolvedValue(makeAuthResponse());
      apiMock.post.mockResolvedValue(makeAuthResponse());

      const { result } = await waitForLoad(authHook());
      // login to have a session
      await act(async () => { await result.current.login('u', 'p'); });

      await act(async () => { await result.current.logout(); });

      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
      expect(result.current.driverActivated).toBe(false);
      expect(secureMock.deleteItemAsync).toHaveBeenCalledWith('jalemos_token');
    });
  });

  describe('register', () => {
    beforeEach(() => {
      secureMock.getItemAsync.mockResolvedValue(null);
    });

    it('returns {success, needsVerification, userId, email} and does NOT log in yet', async () => {
      // Registration now only creates a pending account; the backend returns the
      // ids needed to verify, not a JWT. The user is logged in on verifyEmail.
      apiMock.post.mockResolvedValue({ userId: 'u-42', email: 'e@e.com', expiresAt: '2030-01-01T00:00:00Z' });

      const { result } = await waitForLoad(authHook());

      let res: any;
      await act(async () => {
        res = await result.current.register({
          username: 'u', email: 'e@e.com', firstName: 'F', lastName: 'L', password: 'p',
        });
      });

      expect(res).toEqual({ success: true, needsVerification: true, userId: 'u-42', email: 'e@e.com' });
      // No session is established until the email is verified.
      expect(result.current.token).toBeNull();
      expect(result.current.user).toBeNull();
    });

    it('returns {success:false, error} on ApiError', async () => {
      apiMock.post.mockRejectedValue(new apiMock.ApiError(409, 'Email ya registrado'));

      const { result } = await waitForLoad(authHook());

      let res: any;
      await act(async () => {
        res = await result.current.register({
          username: 'u', email: 'dup@e.com', firstName: 'F', lastName: 'L', password: 'p',
        });
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe('Email ya registrado');
      expect(result.current.token).toBeNull();
    });
  });

  describe('verifyEmail', () => {
    beforeEach(() => { secureMock.getItemAsync.mockResolvedValue(null); });

    it('sets user + token and persists the JWT on success', async () => {
      apiMock.post.mockResolvedValue(makeAuthResponse({ token: 'verified-jwt' }));

      const { result } = await waitForLoad(authHook());

      let res: any;
      await act(async () => {
        res = await result.current.verifyEmail('u-42', '123456');
      });

      expect(res).toEqual({ success: true });
      expect(result.current.token).toBe('verified-jwt');
      expect(result.current.user?.email).toBe('j@test.com');
      expect(secureMock.setItemAsync).toHaveBeenCalledWith('jalemos_token', 'verified-jwt');
    });

    it('returns {success:false, error} and stays logged out on a bad code', async () => {
      apiMock.post.mockRejectedValue(new apiMock.ApiError(400, 'Código incorrecto'));

      const { result } = await waitForLoad(authHook());

      let res: any;
      await act(async () => {
        res = await result.current.verifyEmail('u-42', '000000');
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe('Código incorrecto');
      expect(result.current.token).toBeNull();
    });
  });

  describe('resendVerification', () => {
    beforeEach(() => { secureMock.getItemAsync.mockResolvedValue(null); });

    it('returns {success:true} when the server accepts the resend', async () => {
      apiMock.post.mockResolvedValue({ expiresAt: '2030-01-01T00:00:00Z' });

      const { result } = await waitForLoad(authHook());

      let res: any;
      await act(async () => {
        res = await result.current.resendVerification('u-42');
      });

      expect(res).toEqual({ success: true });
    });

    it('surfaces the cooldown (retryAfterSeconds) from a 429 ApiError', async () => {
      const err: any = new apiMock.ApiError(429, 'Esperá 42 segundos antes de pedir otro código.');
      err.body = { retryAfterSeconds: 42 };
      apiMock.post.mockRejectedValue(err);

      const { result } = await waitForLoad(authHook());

      let res: any;
      await act(async () => {
        res = await result.current.resendVerification('u-42');
      });

      expect(res.success).toBe(false);
      expect(res.retryAfterSeconds).toBe(42);
    });
  });

  describe('setDriverActivated', () => {
    beforeEach(() => { secureMock.getItemAsync.mockResolvedValue(null); });

    it('stores "1" in SecureStore and sets driverActivated=true', async () => {
      const { result } = await waitForLoad(authHook());
      await act(async () => { await result.current.setDriverActivated(true); });
      expect(secureMock.setItemAsync).toHaveBeenCalledWith('jalemos_driver_activated', '1');
      expect(result.current.driverActivated).toBe(true);
    });

    it('removes the key from SecureStore and sets driverActivated=false', async () => {
      const { result } = await waitForLoad(authHook());
      await act(async () => { await result.current.setDriverActivated(false); });
      expect(secureMock.deleteItemAsync).toHaveBeenCalledWith('jalemos_driver_activated');
      expect(result.current.driverActivated).toBe(false);
    });
  });

  describe('upgradeToDriver', () => {
    beforeEach(() => { secureMock.getItemAsync.mockResolvedValue(null); });

    it('returns null when there is no token', async () => {
      const { result } = await waitForLoad(authHook());
      let role: string;
      await act(async () => { role = await result.current.upgradeToDriver(); });
      expect(role!).toBe('passenger');
    });

    it('refreshes user and returns new role on success', async () => {
      // First log in to get a token
      secureMock.getItemAsync.mockResolvedValue(null);
      apiMock.post.mockResolvedValue(makeAuthResponse({ token: 'tok', role: 'passenger' }));
      const { result } = await waitForLoad(authHook());
      await act(async () => { await result.current.login('u', 'p'); });

      apiMock.get.mockResolvedValue(makeAuthResponse({ token: 'tok2', role: 'passenger+driver' }));

      let role: string;
      await act(async () => { role = await result.current.upgradeToDriver(); });

      expect(role!).toBe('passenger+driver');
      expect(result.current.user?.role).toBe('passenger+driver');
    });

    it('returns passenger+driver as offline fallback when refresh fails', async () => {
      secureMock.getItemAsync.mockResolvedValue(null);
      apiMock.post.mockResolvedValue(makeAuthResponse({ token: 'tok', role: 'passenger' }));
      const { result } = await waitForLoad(authHook());
      await act(async () => { await result.current.login('u', 'p'); });

      apiMock.get.mockRejectedValue(new Error('offline'));
      let role: string;
      await act(async () => { role = await result.current.upgradeToDriver(); });

      expect(role!).toBe('passenger+driver');
    });
  });

  // ── Additional branch coverage ─────────────────────────────────────────────

  describe('session restore — role downgrade branch', () => {
    it('deletes driverActivated flag when stored role is no longer passenger+driver', async () => {
      // Token stored, driverActivated="1", but server now says role is "passenger" (admin removed driver role)
      secureMock.getItemAsync
        .mockResolvedValueOnce('stored-jwt')   // TOKEN_KEY
        .mockResolvedValueOnce('1');           // DRIVER_ACTIVATED_KEY
      apiMock.get.mockResolvedValue(makeAuthResponse({ role: 'passenger' }));

      const { result } = await waitForLoad(authHook());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.driverActivated).toBe(false);
      expect(secureMock.deleteItemAsync).toHaveBeenCalledWith('jalemos_driver_activated');
    });
  });

  describe('login — passenger+driver reads existing activation flag', () => {
    it('sets driverActivated=true when SecureStore has the flag during login', async () => {
      secureMock.getItemAsync
        .mockResolvedValueOnce(null)   // session restore: no token
        .mockResolvedValueOnce(null)   // session restore: no activation
        .mockResolvedValueOnce(null)   // login: mode read for passenger+driver
        .mockResolvedValueOnce('1');   // login: reads activation flag for passenger+driver
      apiMock.post.mockResolvedValue(makeAuthResponse({ token: 'tok', role: 'passenger+driver' }));

      const { result } = await waitForLoad(authHook());

      await act(async () => { await result.current.login('u', 'p'); });

      expect(result.current.driverActivated).toBe(true);
    });

    it('sets driverActivated=false when flag is not stored during login as passenger+driver', async () => {
      secureMock.getItemAsync
        .mockResolvedValueOnce(null)   // session restore: no token
        .mockResolvedValueOnce(null)   // session restore: no activation
        .mockResolvedValueOnce(null)   // login: mode read for passenger+driver
        .mockResolvedValueOnce(null);  // login: no activation flag
      apiMock.post.mockResolvedValue(makeAuthResponse({ token: 'tok', role: 'passenger+driver' }));

      const { result } = await waitForLoad(authHook());

      await act(async () => { await result.current.login('u', 'p'); });

      expect(result.current.driverActivated).toBe(false);
    });
  });
});
