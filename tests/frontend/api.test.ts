describe('FrontEnd services/api', () => {
  const originalFetch = global.fetch;
  const originalApiUrl = process.env.EXPO_PUBLIC_API_URL;

  beforeEach(() => {
    jest.resetModules();
    process.env.EXPO_PUBLIC_API_URL = 'http://api.test';
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
    process.env.EXPO_PUBLIC_API_URL = originalApiUrl;
  });

  it('get sends bearer token and parses json response', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });

    const api = await import('../../FrontEnd/services/api');
    const result = await api.get<{ ok: boolean }>('/api/health', 'abc123');

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/health',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Authorization: 'Bearer abc123',
        }),
      }),
    );
  });

  it('request throws ApiError with backend error body', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'invalid token' }),
    });

    const api = await import('../../FrontEnd/services/api');
    await expect(api.get('/api/private')).rejects.toMatchObject({
      name: 'ApiError',
      status: 401,
      message: 'invalid token',
    });
  });

  it('usersApi getAll builds query string from filters', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        users: [],
        totalCount: 0,
        page: 1,
        pageSize: 10,
        totalPages: 0,
      }),
    });

    const api = await import('../../FrontEnd/services/api');
    await api.usersApi.getAll(
      {
        search: 'ana',
        role: 'driver',
        status: 'active',
        sortBy: 'name_asc',
        page: 2,
        pageSize: 25,
      },
      'jwt',
    );

    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/users?search=ana&role=driver&status=active&sortBy=name_asc&page=2&pageSize=25',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('returns undefined for 204 responses', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => ({}),
    });

    const api = await import('../../FrontEnd/services/api');
    const result = await api.patch<void>('/api/users/id/activate', {}, 'jwt');

    expect(result).toBeUndefined();
  });

  // ── post ────────────────────────────────────────────────────────────────────

  it('post sends body and bearer token', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ id: '1' }) });

    const api = await import('../../FrontEnd/services/api');
    const result = await api.post<{ id: string }>('/api/auth/login', { identifier: 'u', password: 'p' }, 'tok');

    expect(result).toEqual({ id: '1' });
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ identifier: 'u', password: 'p' }),
        headers: expect.objectContaining({ Authorization: 'Bearer tok' }),
      }),
    );
  });

  it('request uses body.detail as error message when body.error is absent', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ detail: 'Validation failed' }),
    });

    const api = await import('../../FrontEnd/services/api');
    await expect(api.get('/api/trips')).rejects.toMatchObject({
      name: 'ApiError',
      status: 422,
      message: 'Validation failed',
    });
  });

  it('request falls back to "Error <status>" when body has no error or detail', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    const api = await import('../../FrontEnd/services/api');
    await expect(api.get('/api/broken')).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
      message: 'Error 500',
    });
  });

  it('get works without a token (no Authorization header)', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => [] });

    const api = await import('../../FrontEnd/services/api');
    await api.get('/api/public');

    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/public',
      expect.objectContaining({
        headers: expect.not.objectContaining({ Authorization: expect.anything() }),
      }),
    );
  });

  // ── usersApi ────────────────────────────────────────────────────────────────

  it('usersApi.getAll works with no filter params', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({
      ok: true, status: 200,
      json: async () => ({ users: [], totalCount: 0, page: 1, pageSize: 30, totalPages: 0 }),
    });
    const api = await import('../../FrontEnd/services/api');
    await api.usersApi.getAll({}, 'tok');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/users',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('usersApi.getById calls GET /api/users/:id', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ id: 'u1' }) });
    const api = await import('../../FrontEnd/services/api');
    await api.usersApi.getById('u1', 'tok');
    expect(fetchMock).toHaveBeenCalledWith('http://api.test/api/users/u1', expect.anything());
  });

  it('usersApi.changeRole calls PATCH /api/users/:id/role', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({ ok: true, status: 204, json: async () => ({}) });
    const api = await import('../../FrontEnd/services/api');
    await api.usersApi.changeRole('u1', 'driver', 'tok');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/users/u1/role',
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ role: 'driver' }) }),
    );
  });

  it('usersApi.ban calls PATCH /api/users/:id/ban with days', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({ ok: true, status: 204, json: async () => ({}) });
    const api = await import('../../FrontEnd/services/api');
    await api.usersApi.ban('u1', 7, 'tok');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/users/u1/ban',
      expect.objectContaining({ body: JSON.stringify({ days: 7 }) }),
    );
  });

  it('usersApi.liftBan calls PATCH /api/users/:id/lift-ban', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({ ok: true, status: 204, json: async () => ({}) });
    const api = await import('../../FrontEnd/services/api');
    await api.usersApi.liftBan('u1', 'tok');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/users/u1/lift-ban',
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('usersApi.deactivate calls PATCH /api/users/:id/deactivate', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({ ok: true, status: 204, json: async () => ({}) });
    const api = await import('../../FrontEnd/services/api');
    await api.usersApi.deactivate('u1', 'tok');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/users/u1/deactivate',
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('usersApi.activate calls PATCH /api/users/:id/activate', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({ ok: true, status: 204, json: async () => ({}) });
    const api = await import('../../FrontEnd/services/api');
    await api.usersApi.activate('u1', 'tok');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/users/u1/activate',
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  // ── vehiclesApi ─────────────────────────────────────────────────────────────

  it('vehiclesApi.getMy calls GET /api/vehicles/my', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => [] });
    const api = await import('../../FrontEnd/services/api');
    await api.vehiclesApi.getMy('tok');
    expect(fetchMock).toHaveBeenCalledWith('http://api.test/api/vehicles/my', expect.anything());
  });

  it('vehiclesApi.getByUserId calls GET /api/vehicles/user/:userId', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => [] });
    const api = await import('../../FrontEnd/services/api');
    await api.vehiclesApi.getByUserId('u1', 'tok');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/vehicles/user/u1',
      expect.anything(),
    );
  });

  it('vehiclesApi.delete calls DELETE /api/vehicles/:id', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({ ok: true, status: 204, json: async () => ({}) });
    const api = await import('../../FrontEnd/services/api');
    await api.vehiclesApi.delete('v1', 'tok');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/vehicles/v1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });

  // ── applicationsApi ──────────────────────────────────────────────────────────

  it('applicationsApi.getMy calls GET /api/driver-applications/my', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => null });
    const api = await import('../../FrontEnd/services/api');
    await api.applicationsApi.getMy('tok');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/driver-applications/my',
      expect.anything(),
    );
  });

  it('applicationsApi.getAll calls GET /api/driver-applications with optional status', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => [] });
    const api = await import('../../FrontEnd/services/api');
    await api.applicationsApi.getAll('tok', 'pending');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/driver-applications?status=pending',
      expect.anything(),
    );
  });

  it('applicationsApi.getAll omits status when not provided', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => [] });
    const api = await import('../../FrontEnd/services/api');
    await api.applicationsApi.getAll('tok');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/driver-applications',
      expect.anything(),
    );
  });

  it('applicationsApi.getById calls GET /api/driver-applications/:id', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ applicationId: 'a1' }) });
    const api = await import('../../FrontEnd/services/api');
    await api.applicationsApi.getById('a1', 'tok');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/driver-applications/a1',
      expect.anything(),
    );
  });

  it('applicationsApi.submit calls POST /api/driver-applications with upload timeout', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ applicationId: 'a1' }) });
    const api = await import('../../FrontEnd/services/api');
    const payload = {
      facePhoto: null, licensePhotoFront: null, licensePhotoBack: null, dekraPhoto: null,
      licenseExpiryMonth: null, licenseExpiryYear: null, dekraExpiryMonth: null, dekraExpiryYear: null,
    };
    await api.applicationsApi.submit(payload, 'tok');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/driver-applications',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('applicationsApi.resubmit calls POST /api/driver-applications/:id/resubmit', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ applicationId: 'a1' }) });
    const api = await import('../../FrontEnd/services/api');
    await api.applicationsApi.resubmit('a1', {
      facePhoto: null, licensePhotoFront: null, licensePhotoBack: null, dekraPhoto: null,
      licenseExpiryMonth: null, licenseExpiryYear: null, dekraExpiryMonth: null, dekraExpiryYear: null,
    }, 'tok');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/driver-applications/a1/resubmit',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('applicationsApi.setUnderReview calls PATCH /api/driver-applications/:id/under-review', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({ ok: true, status: 204, json: async () => ({}) });
    const api = await import('../../FrontEnd/services/api');
    await api.applicationsApi.setUnderReview('a1', 'tok');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/driver-applications/a1/under-review',
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('applicationsApi.requestCorrection calls PATCH with issueIds and notes', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({ ok: true, status: 204, json: async () => ({}) });
    const api = await import('../../FrontEnd/services/api');
    await api.applicationsApi.requestCorrection('a1', { issueIds: ['bad_photo'], notes: 'Fix it' }, 'tok');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/driver-applications/a1/request-correction',
      expect.objectContaining({ body: JSON.stringify({ issueIds: ['bad_photo'], notes: 'Fix it' }) }),
    );
  });

  it('applicationsApi.approve calls PATCH /api/driver-applications/:id/approve', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({ ok: true, status: 204, json: async () => ({}) });
    const api = await import('../../FrontEnd/services/api');
    await api.applicationsApi.approve('a1', 'tok');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/driver-applications/a1/approve',
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('applicationsApi.reject calls PATCH /api/driver-applications/:id/reject', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({ ok: true, status: 204, json: async () => ({}) });
    const api = await import('../../FrontEnd/services/api');
    await api.applicationsApi.reject('a1', { issueIds: ['fake_docs'], notes: 'Rejected' }, 'tok');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/driver-applications/a1/reject',
      expect.objectContaining({ method: 'PATCH' }),
    );
  });

  it('applicationsApi.submitVehicle calls POST /api/driver-applications/vehicle', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ applicationId: 'a2' }) });
    const api = await import('../../FrontEnd/services/api');
    await api.applicationsApi.submitVehicle(
      { vehicleBrand: 'Toyota', vehicleModel: 'Corolla', vehicleYear: 2020, vehiclePlate: 'ABC-123', vehicleColor: 'Blanco' },
      'tok',
    );
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/driver-applications/vehicle',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('applicationsApi.getMyVehicles calls GET /api/driver-applications/my-vehicles', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => [] });
    const api = await import('../../FrontEnd/services/api');
    await api.applicationsApi.getMyVehicles('tok');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/driver-applications/my-vehicles',
      expect.anything(),
    );
  });

  // ── bookingsApi ─────────────────────────────────────────────────────────────

  it('bookingsApi.create calls POST /api/bookings', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ id: 'b1' }) });
    const api = await import('../../FrontEnd/services/api');
    await api.bookingsApi.create('trip-1', 2, 3000, 'tok');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/bookings',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ tripId: 'trip-1', seatsReserved: 2, estimatedAmount: 3000 }),
      }),
    );
  });

  it('bookingsApi.getAll calls GET /api/bookings', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => [] });
    const api = await import('../../FrontEnd/services/api');
    await api.bookingsApi.getAll('tok');
    expect(fetchMock).toHaveBeenCalledWith('http://api.test/api/bookings', expect.anything());
  });

  it('bookingsApi.getById calls GET /api/bookings/:id', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ id: 'b1' }) });
    const api = await import('../../FrontEnd/services/api');
    await api.bookingsApi.getById('b1', 'tok');
    expect(fetchMock).toHaveBeenCalledWith('http://api.test/api/bookings/b1', expect.anything());
  });

  it('bookingsApi.delete calls DELETE /api/bookings/:id', async () => {
    const fetchMock = global.fetch as unknown as jest.Mock;
    fetchMock.mockResolvedValue({ ok: true, status: 204, json: async () => ({}) });
    const api = await import('../../FrontEnd/services/api');
    await api.bookingsApi.delete('b1', 'tok');
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/api/bookings/b1',
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});
