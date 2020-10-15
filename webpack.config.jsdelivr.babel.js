import webpack from 'webpack';
import { join } from 'path';

export default {
  entry: './index.js',
  devtool: 'source-map',
  output: {
    path: join(__dirname, 'dist/cdn'),
    filename: 'docs-searchbar.js',
    library: 'docsSearchBar',
    libraryTarget: 'umd',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: [['@babel/preset-env', { modules: 'cjs' }]],
        },
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
