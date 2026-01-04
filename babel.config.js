module.exports = function (api) {
  api.cache(true);

  const isProduction = process.env.NODE_ENV === 'production';

  const plugins = [
    // Fix import.meta.env for Metro web bundling (zustand uses this)
    './babel-plugin-import-meta-env.js',
    'react-native-reanimated/plugin',
  ];

  // Remove console.log statements in production
  if (isProduction) {
    plugins.push('transform-remove-console');
  }

  return {
    presets: ['babel-preset-expo'],
    plugins,
  };
};
