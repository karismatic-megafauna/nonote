const path = require('path')

module.exports = {
  context: __dirname,
  entry: [
    'babel-polyfill',
    './main.js',
  ],
  target: 'node',
  output: {
    path: path.join(__dirname, '/lib'),
    filename: 'main.js',
  },
  resolve: {
    extensions: ['','.js', '.json'],
  },
  stats: {
    colors: true,
    reasons: true,
    chunks: false,
  },
  module: {
    loaders: [
      {
        test: /\.json$/,
        loader: 'json-loader',
 				exclude: /node_modules/,
        query: {
          presets: ['es2015']
        }
      },
      {
        test: /\.js$/,
 				exclude: /node_modules/,
        loader: 'babel-loader',
      },
    ],
  }
}
