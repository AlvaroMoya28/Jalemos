// Stub for react-native-maps
const React = require('react');
const MapView = ({ children, style }) => React.createElement('div', { style }, children);
MapView.Animated = MapView;
module.exports = MapView;
module.exports.default = MapView;
module.exports.Marker   = 'Marker';
module.exports.Polyline = 'Polyline';
module.exports.PROVIDER_GOOGLE = 'google';
module.exports.PROVIDER_DEFAULT = 'default';
