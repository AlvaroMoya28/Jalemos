const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Block the nested react-native@0.86 pulled in by @react-native/community-cli-plugin@0.86
// to prevent codegen version mismatch (codegen 0.83 can't parse RN 0.86 component files)
config.resolver.blockList = [
  new RegExp(
    path.join(__dirname, 'node_modules/react-native/node_modules/react-native').replace(/\\/g, '\\\\') + '/.*'
  ),
];

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.endsWith('.fx')) {
    for (const ext of ['.tsx', '.ts']) {
      try {
        return context.resolveRequest(context, moduleName + ext, platform);
      } catch {
        // try next extension
      }
    }
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
