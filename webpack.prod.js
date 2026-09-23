// SPDX-FileCopyrightText: NOI Techpark <digital@noi.bz.it>
//
// SPDX-License-Identifier: CC0-1.0

var path = require('path');
var Dotenv = require('dotenv-webpack');

module.exports = {
  mode: 'production',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'map_widget.min.js'
  },
   resolve: {
    alias: {
      '@maplibre/maplibre-gl-leaflet$': path.resolve(
        __dirname,
        'node_modules/@maplibre/maplibre-gl-leaflet/leaflet-maplibre-gl.js'
      )
    }
  },
  module: {
  rules: [
    {
      test: /\.scss$/,
      use: [{ loader: 'css-loader' }, { loader: 'sass-loader' }]
    },
    {
      test: /\.css$/,
      use: [{ loader: 'css-loader' }]
    },
    {
      test: /\.(png|jpg|gif|ttf)$/i,
      use: [
        {
          loader: 'url-loader',
          options: {
            limit: 10000
          }
        }
      ]
    },
    {
      test: /\.svg$/,
      loader: 'svg-inline-loader'
    }
  ]
},
  plugins: [
    new Dotenv()
  ]
};
