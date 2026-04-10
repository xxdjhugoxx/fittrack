const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Block react-native-maps on web — it uses native-only code
// that Metro cannot bundle for web platforms
config.resolver.blockList = [
  /react-native-maps\/.*/,
];

module.exports = config;
