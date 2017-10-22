const webpack = require('webpack');
const path = require('path');
const fs = require('fs');

const cfg = require('./webpack/cfg.json');

const nodeModules = {};

fs.readdirSync('node_modules')
  .filter(x => ['.bin'].indexOf(x) === -1)
  .forEach(mod => {
    nodeModules[mod] = 'commonjs ' + mod;
  })
;

module.exports = {
  entry: cfg.paths.entry,
  target: 'node',
  devtool: 'source-map',
  output: {
    path: path.join(__dirname, cfg.paths.dist),
    filename: cfg.paths.outFile
  },
  resolve: {
    extensions: ['.ts', '.js', '.json'],
  },
  module: {
    rules: [
      { test: /\.ts$/, loader: 'awesome-typescript-loader' },
      { enforce: 'pre', test: /\.js$/, loader: 'source-map-loader' },
    ],
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: 'require("source-map-support").install();',
      raw: true,
      entryOnly: false,
    }),
  ],
  externals: nodeModules,
};
