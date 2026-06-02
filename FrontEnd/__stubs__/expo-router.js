// Stub for expo-router
const React = require('react');

function Link({ children, href, onPress, target, ...rest }) {
  return React.createElement('a', {
    href,
    onClick: (e) => { if (onPress) onPress(e); },
    target,
  }, children);
}

module.exports = { Link, useRouter: jest.fn().mockReturnValue({ push: jest.fn(), back: jest.fn() }) };
