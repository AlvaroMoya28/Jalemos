// Minimal react-native stub for jest tests.
// Provides only what the FrontEnd source files actually use in non-component code.
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
  },
  View: 'View',
  Text: 'Text',
};
