// Stub for expo-web-browser
module.exports = {
  openBrowserAsync: jest.fn().mockResolvedValue({ type: 'dismiss' }),
  WebBrowserPresentationStyle: { AUTOMATIC: 'automatic', FULL_SCREEN: 'fullScreen' },
};
