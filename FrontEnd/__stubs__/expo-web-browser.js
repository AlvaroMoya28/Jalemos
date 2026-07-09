// Stub for expo-web-browser
module.exports = {
  openBrowserAsync: jest.fn().mockResolvedValue({ type: 'dismiss' }),
  maybeCompleteAuthSession: jest.fn(() => ({ type: 'failed', message: 'stub' })),
  WebBrowserPresentationStyle: { AUTOMATIC: 'automatic', FULL_SCREEN: 'fullScreen' },
};
