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
  ImageBackground: ({ children, source, style }) =>
    React.createElement('div', { style }, children),
  ScrollView: 'ScrollView',
  FlatList: 'FlatList',
  Modal: 'Modal',
  TextInput: ({ value, onChangeText, style, placeholder, secureTextEntry, ...rest }) =>
    React.createElement('input', {
      value: value !== undefined ? value : '',
      onChange: (e) => { if (onChangeText) onChangeText(e.target.value); },
      placeholder,
      style,
      type: secureTextEntry ? 'password' : 'text',
    }),
  SafeAreaView: 'SafeAreaView',
  KeyboardAvoidingView: ({ children, style }) =>
    React.createElement('div', { style }, children),
  ActivityIndicator: ({ style }) => React.createElement('span', { style }, '...'),
  // Interactive elements — functional so onPress/onPressIn fire via click/mousedown/mouseup
  Pressable: ({ children, onPress, onPressIn, onPressOut, style }) =>
    React.createElement('button', {
      onClick: onPress,
      onMouseDown: onPressIn,
      onMouseUp: onPressOut,
      style,
    }, children),
  TouchableOpacity: ({ children, onPress, style }) =>
    React.createElement('button', { onClick: onPress, style }, children),
  TouchableHighlight: ({ children, onPress, style }) =>
    React.createElement('button', { onClick: onPress, style }, children),
  TouchableWithoutFeedback: ({ children, onPress }) =>
    React.createElement('div', { onClick: onPress }, children),
  // Utilities
  Keyboard: { dismiss: jest.fn(), addListener: jest.fn(), removeListener: jest.fn() },
  Linking: { openURL: jest.fn().mockResolvedValue(undefined) },
  Alert: { alert: jest.fn() },
  Share: { share: jest.fn().mockResolvedValue({ action: 'sharedAction' }) },
  ActionSheetIOS: { showActionSheetWithOptions: jest.fn() },
  Dimensions: { get: jest.fn().mockReturnValue({ width: 375, height: 812 }) },
  Easing: {
    out:    jest.fn(fn => fn),
    in:     jest.fn(fn => fn),
    inOut:  jest.fn(fn => fn),
    quad:   jest.fn(v => v),
    cubic:  jest.fn(v => v),
    linear: jest.fn(v => v),
    ease:   jest.fn(v => v),
    sin:    jest.fn(v => v),
    back:   jest.fn(() => jest.fn(v => v)),
    bounce: jest.fn(v => v),
    elastic: jest.fn(() => jest.fn(v => v)),
  },
  NativeScrollEvent: {},
  NativeSyntheticEvent: {},
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
