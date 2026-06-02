// Stub for expo-router
const React = require('react');

function Link({ children, href, onPress, target, dismissTo, asChild, ...rest }) {
  return React.createElement('a', {
    href,
    onClick: (e) => { if (onPress) onPress(e); },
    target,
  }, children);
}

const Stack = {
  Screen: () => null,
};

const Tabs = {
  Screen: () => null,
};

const mockRouter = {
  push:     jest.fn(),
  back:     jest.fn(),
  replace:  jest.fn(),
  navigate: jest.fn(),
  dismiss:  jest.fn(),
};

// NativeTabs stub (expo-router/unstable-native-tabs)
const NativeTabs = {
  Screen: () => null,
};

module.exports = {
  Link,
  Stack,
  Tabs,
  NativeTabs,
  router:                  mockRouter,
  useRouter:               jest.fn().mockReturnValue(mockRouter),
  useLocalSearchParams:    jest.fn().mockReturnValue({}),
  useNavigation:           jest.fn().mockReturnValue({ setOptions: jest.fn(), navigate: jest.fn(), dispatch: jest.fn() }),
  useFocusEffect:          jest.fn(cb => { try { cb(); } catch {} }),
  useSegments:             jest.fn().mockReturnValue([]),
  usePathname:             jest.fn().mockReturnValue('/'),
  useGlobalSearchParams:   jest.fn().mockReturnValue({}),
  Redirect:                ({ href }) => null,
};
