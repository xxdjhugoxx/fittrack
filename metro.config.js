const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Block react-native-maps from web builds — it's native-only
config.resolver.blockList = [
  /node_modules\/react-native-maps\/.*/,
];

module.exports = config;
