const path = require('path');
const globby = require('globby');

const CopyWebpackPlugin = require('copy-webpack-plugin');

const cfg = require('./webpack/cfg.json');
const baseConfig = require('./webpack/base.config');

const testPaths = globby.sync([cfg.paths.test.src]);

if (testPaths.length === 0) {
  throw new Error('No test files found.');
}

const entries = {};

testPaths.forEach(
  testPath => entries[path.basename(testPath, '.ts')] = testPath
);

module.exports = {
  ...baseConfig,
  entry: entries,
  output: {
    ...baseConfig.output,
    path: path.join(__dirname, cfg.paths.test.dist),
    filename: '[name].js',
  },
  plugins:
    baseConfig.plugins.concat(
      [
        new CopyWebpackPlugin(
          cfg.paths.test.copy
        ),
      ]
    ),
};
