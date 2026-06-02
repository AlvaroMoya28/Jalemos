// Stub for @react-navigation/elements
const React = require('react');

function PlatformPressable({ children, onPressIn, onPress, style, ...rest }) {
  return React.createElement('button', {
    onClick: (e) => {
      if (onPressIn) onPressIn(e);
      if (onPress) onPress(e);
    },
    style,
  }, children);
}

module.exports = { PlatformPressable };
