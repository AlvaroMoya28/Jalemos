// Minimal stub for react-native-reanimated
const React = require('react');

const AnimatedNS = {
  View:       ({ children, style }) => React.createElement('div',  { style }, children),
  Text:       ({ children, style }) => React.createElement('span', { style }, children),
  ScrollView: ({ children, style }) => React.createElement('div',  { style }, children),
  FlatList:   ({ data, renderItem, keyExtractor, style }) =>
    React.createElement('div', { style }, data ? data.map((item, i) => renderItem({ item, index: i })) : null),
  Image:      ({ style }) => React.createElement('img', { style }),
  // Required by animated-pressable.tsx and similar components
  createAnimatedComponent: (Component) => Component,
};

module.exports = AnimatedNS;
module.exports.default = AnimatedNS;

// Hooks
module.exports.useSharedValue    = jest.fn().mockImplementation(v => ({ value: v }));
module.exports.useAnimatedStyle  = jest.fn().mockReturnValue({});
module.exports.useAnimatedRef    = jest.fn().mockReturnValue({ current: null });
module.exports.useAnimatedScrollHandler = jest.fn().mockReturnValue(() => {});
module.exports.useDerivedValue   = jest.fn(fn => ({ value: fn() }));
module.exports.runOnJS           = jest.fn(fn => fn);
module.exports.runOnUI           = jest.fn(fn => fn);

// Animations (return value immediately)
module.exports.withTiming        = jest.fn(v => v);
module.exports.withSpring        = jest.fn(v => v);
module.exports.withDelay         = jest.fn((d, a) => a);
module.exports.withRepeat        = jest.fn(a => a);
module.exports.withSequence      = jest.fn((...a) => a[a.length - 1]);

// Easing
module.exports.Easing = { inOut: jest.fn(fn => fn), sin: jest.fn(), linear: jest.fn(v => v) };

// Layout animations (just plain objects, used as props by components)
module.exports.FadeIn          = {};
module.exports.FadeOut         = {};
module.exports.FadeInDown      = {};
module.exports.FadeInUp        = {};
module.exports.LinearTransition = {};
module.exports.ZoomIn          = {};
module.exports.ZoomOut         = {};
module.exports.SlideInRight    = {};
module.exports.SlideOutLeft    = {};
