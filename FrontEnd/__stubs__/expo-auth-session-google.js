// Stub for expo-auth-session and expo-auth-session/providers/google.
// The hooks return [request, response, promptAsync]; inert values are enough for tests.
const makeAuthRequest = () => [
  null, // request (null => hook's `ready` is false)
  null, // response (null => the response effect no-ops)
  jest.fn().mockResolvedValue({ type: 'dismiss' }), // promptAsync
];

module.exports = {
  useIdTokenAuthRequest: jest.fn(makeAuthRequest),
  useAuthRequest: jest.fn(makeAuthRequest),
  ResponseType: { IdToken: 'id_token', Token: 'token', Code: 'code' },
};
