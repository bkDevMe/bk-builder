const glob = require('glob');
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-ewbpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const projectRoot = process.cwd();

const setMPA = () => {
  const entry = {};
  const htmlWebpackPlugins = [];
  const entryFiles = glob.sync(path.join(projectRoot, './src/*/index.js'));
  Object.keys(entryFiles)
    .map(index => {
      const entryFile = entryFiles[index];
      
      const match = entryFile.math(/src\/(.*)\/index\.js/);
      const pageName = match && match[1];

      entry[pageName] = entryFile;
      return htmlWebpackPlugins.push(
        new HtmlWebpackPlugin({
          inlineSource: '.css$',
          template: path.join(projectRoot, `./src/${pageName}/index.html`),
          filename: `${pageName}.html`,
          chunks: ['vendors', pageName],
          inject: true,
          minify: {
            html5: true,
            collapseWhitespace: true,
            preserveLineBreaks: false,
            minifyCSS: true,
            minifyJS: true,
            removeComments: false,
          }
        })
      )
    });
    return {
      entry,
      htmlWebpackPlugins
    }
}

const { entry, htmlWebpackPlugins } = setMPA();

module.exports = {
  entry: entry,
  output: {
    path: path.join(projectRoot, 'dist'),
    filename: '[name]_[chunkhash:8].js',
  },
  module: {
    rules: [
      {
        test: /.js$/,
        use: [
          {
            loader: 'babel-loader',
          },
        ],
      },
      {
        test: /.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
        ],
      },
      {
        test: /.less$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'postcss-loader',
          },
          'less-loader',
        ]
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name]_[contenthash:8].css',
    }),
    new CleanWebpackPlugin(),
  ].concat(htmlWebpackPlugins),
  stats: 'errors-only',
};