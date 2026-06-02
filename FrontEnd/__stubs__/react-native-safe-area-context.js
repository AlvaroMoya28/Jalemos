// Stub for react-native-safe-area-context
const React = require('react');
module.exports = {
  useSafeAreaInsets:     jest.fn().mockReturnValue({ top: 44, bottom: 34, left: 0, right: 0 }),
  SafeAreaProvider:      ({ children }) => children,
  SafeAreaView:          ({ children, style }) => React.createElement('div', { style }, children),
  useSafeAreaFrame:      jest.fn().mockReturnValue({ x: 0, y: 0, width: 375, height: 812 }),
  initialWindowMetrics:  { insets: { top: 44, bottom: 34, left: 0, right: 0 }, frame: { x: 0, y: 0, width: 375, height: 812 } },
};
