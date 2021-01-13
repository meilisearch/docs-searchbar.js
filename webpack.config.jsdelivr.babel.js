import webpack from 'webpack';
import { join } from 'path';

export default {
  mode: process.env.NODE_ENV || 'development',
  entry: './index.js',
  devtool: 'source-map',
  output: {
    path: join(__dirname, 'dist/cdn'),
    filename: 'docs-searchbar.js',
    library: 'docsSearchBar',
    libraryTarget: 'umd',
    libraryExport: 'default',
  },
  externals: {
    docsSearchBar: 'docsSearchBar',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      },
    }),
  ],
};
