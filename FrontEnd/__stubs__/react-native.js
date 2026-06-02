// Minimal react-native stub for jest tests.
const React = require('react');

module.exports = {
  Platform: {
    OS: 'ios',
    select: (obj) => obj['ios'] ?? obj['default'],
  },
  useColorScheme: jest.fn().mockReturnValue('light'),
  StyleSheet: {
    create: (styles) => styles,
    flatten: (style) => style,
    hairlineWidth: 0.5,
    absoluteFillObject: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  },
  // Passive containers — rendered as custom elements in jsdom
  View: 'View',
  Text: 'Text',
  Image: 'Image',
  ScrollView: 'ScrollView',
  FlatList: 'FlatList',
  Modal: 'Modal',
  TextInput: 'TextInput',
  SafeAreaView: 'SafeAreaView',
  // Interactive elements — functional so onPress/onPressIn fire via onClick
  Pressable: ({ children, onPress, style }) =>
    React.createElement('button', { onClick: onPress, style }, children),
  TouchableOpacity: ({ children, onPress, style }) =>
    React.createElement('button', { onClick: onPress, style }, children),
  TouchableHighlight: ({ children, onPress, style }) =>
    React.createElement('button', { onClick: onPress, style }, children),
  // Utilities
  Linking: { openURL: jest.fn().mockResolvedValue(undefined) },
  Alert: { alert: jest.fn() },
  Dimensions: { get: jest.fn().mockReturnValue({ width: 375, height: 812 }) },
  Animated: {
    Value: jest.fn().mockImplementation(() => ({
      interpolate: jest.fn().mockReturnValue(0),
      setValue: jest.fn(),
      addListener: jest.fn(),
      removeAllListeners: jest.fn(),
    })),
    View: 'Animated.View',
    Text: 'Animated.Text',
    timing: jest.fn().mockReturnValue({ start: jest.fn() }),
    spring: jest.fn().mockReturnValue({ start: jest.fn() }),
    loop: jest.fn().mockReturnValue({ start: jest.fn() }),
    sequence: jest.fn().mockReturnValue({ start: jest.fn() }),
    parallel: jest.fn().mockReturnValue({ start: jest.fn() }),
    delay: jest.fn().mockReturnValue({ start: jest.fn() }),
  },
};
