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
});
