const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

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
