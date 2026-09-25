const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,
    publicPath: './' 
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'index.html', to: '' }, 
      ],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        type: 'asset/resource'
      }
    ]
  },
  devServer: {
    static: '.',
    open: true,
    port: 8080,
    hot: true
  }
};

