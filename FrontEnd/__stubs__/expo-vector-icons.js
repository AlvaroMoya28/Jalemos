// Stub for @expo/vector-icons (Ionicons, MaterialIcons, etc.)
const React = require('react');

function makeIcon(family) {
  function Icon({ name, size, color, style }) {
    return React.createElement('span', {
      'data-testid': `icon-${family}`,
      'data-icon': name,
      'data-size': size,
      style: { color, ...style },
    });
  }
  Icon.displayName = family;
  return Icon;
}

const MaterialIcons = makeIcon('MaterialIcons');
const Ionicons     = makeIcon('Ionicons');
const FontAwesome  = makeIcon('FontAwesome');
const AntDesign    = makeIcon('AntDesign');

// Default export covers: import MaterialIcons from '@expo/vector-icons/MaterialIcons'
module.exports = MaterialIcons;
module.exports.default = MaterialIcons;

// Named exports cover: import { Ionicons } from '@expo/vector-icons'
module.exports.MaterialIcons = MaterialIcons;
module.exports.Ionicons     = Ionicons;
module.exports.FontAwesome  = FontAwesome;
module.exports.AntDesign    = AntDesign;
