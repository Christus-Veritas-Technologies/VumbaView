// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

  const { withNativeWind } = require("nativewind/metro");


/** @type {import('expo/metro-config').MetroConfig} */
// eslint-disable-next-line no-undef
const config = getDefaultConfig(__dirname);

// This is a pnpm workspace: cross-package deps (e.g. nativewind ->
// react-native-css-interop) live behind symlinks/junctions in the pnpm
// store rather than being flatly hoisted into apps/reception/node_modules.
// Metro's resolver doesn't follow those by default, which is what was
// causing "Unable to resolve react-native-css-interop/jsx-runtime" — see
// https://docs.expo.dev/guides/monorepos/.
config.resolver.unstable_enableSymlinks = true;

module.exports = withNativeWind(config, { input: "./global.css" });
