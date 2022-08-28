const webpack = require('webpack');
const glob = require('glob');
const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');

const projectRoot = process.cwd();

const setMPA = () => {
  const entry = {};
  const htmlWebpackPlugins = [];
  const entryFiles = glob.sync(path.join(projectRoot, './src/*/index.js'));
  Object.keys(entryFiles)
    .map(index => {
      const entryFile = entryFiles[index];
      const match = entryFile.match(/src\/(.*)\/index\.js/);
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
            // 移除空格
            collapseWhitespace: true,
            preserveLineBreaks: false,
            minifyCSS: true,
            minifyJS: true,
            // 移除注释
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

/*
  缓存：
    babel缓存
      cacheDirectory: true
      --> 让第二次打包构建速度更快
    文件资源缓存
      hash: 每次wepack构建时会生成一个唯一的hash值。
        问题: 因为js和css同时使用一个hash值。
          如果重新打包，会导致所有缓存失效。（可能我却只改动一个文件）
      chunkhash：根据chunk生成的hash值。如果打包来源于同一个chunk，那么hash值就一样
        问题: js和css的hash值还是一样的
          因为css是在js中被引入的，所以同属于一个chunk
      contenthash: 根据文件的内容生成hash值。不同文件hash值一定不一样
      --> 让代码上线运行缓存更好使用
*/

/*
  source-map: 一种 提供源代码到构建后代码映射 技术 （如果构建后代码出错了，通过映射可以追踪源代码错误）

    [inline-|hidden-|eval-][nosources-][cheap-[module-]]source-map

    source-map：外部
      错误代码准确信息 和 源代码的错误位置
    inline-source-map：内联
      只生成一个内联source-map
      错误代码准确信息 和 源代码的错误位置
    hidden-source-map：外部
      错误代码错误原因，但是没有错误位置
      不能追踪源代码错误，只能提示到构建后代码的错误位置
    eval-source-map：内联
      每一个文件都生成对应的source-map，都在eval
      错误代码准确信息 和 源代码的错误位置
    nosources-source-map：外部
      错误代码准确信息, 但是没有任何源代码信息
    cheap-source-map：外部
      错误代码准确信息 和 源代码的错误位置
      只能精确的行
    cheap-module-source-map：外部
      错误代码准确信息 和 源代码的错误位置
      module会将loader的source map加入

    内联 和 外部的区别：1. 外部生成了文件，内联没有 2. 内联构建速度更快

    开发环境：速度快，调试更友好
      速度快(eval>inline>cheap>...)
        eval-cheap-souce-map
        eval-source-map
      调试更友好
        souce-map
        cheap-module-souce-map
        cheap-souce-map

      --> eval-source-map  / eval-cheap-module-souce-map

    生产环境：源代码要不要隐藏? 调试要不要更友好
      内联会让代码体积变大，所以在生产环境不用内联
      nosources-source-map 全部隐藏
      hidden-source-map 只隐藏源代码，会提示构建后代码错误信息

      --> source-map / cheap-module-souce-map
*/

// 定义nodejs环境变量：决定使用browserslist的哪个环境
process.env.NODE_ENV = 'production';

module.exports = {
  entry: entry,
  // 输出
  output: {
    // 输入路径
    path: path.join(projectRoot, 'dist'),
    // 输出文件名
    // filename: 'built.js',
    filename: 'js/[name].[contenthash:10].js',
    // 资源文件地址
    assetModuleFilename: 'images/[hash:10][ext][query]',
  },
  resolve: {
    // 配置解析模块路径别名: 优点简写路径 缺点路径没有提示
    alias: {
      $css: resolve(__dirname, 'src/css'),
    },
    // 配置省略文件路径的后缀名
    extensions: ['.js', '.json', '.jsx', '.css', '.tsx', '.ts'],
    // 告诉 webpack 解析模块是去找哪个目录
    // modules: [resolve(__dirname, '../../node_modules'), 'node_modules'],
  },
  module: {
    /*
      语法检查： eslint-loader  eslint
        注意：只检查自己写的源代码，第三方的库是不用检查的
        设置检查规则：
          package.json中eslintConfig中设置~
            "eslintConfig": {
              "extends": "airbnb-base"
            }
          airbnb --> eslint-config-airbnb-base  eslint-plugin-import eslint
    */
    rules: [
      {
        test: /\.css$/i,
        use: [
          // "style-loader",
          // 这个loader取代style-loader。作用：提取js中的css成单独文件
          MiniCssExtractPlugin.loader,
          'css-loader',
          // postcss的插件 css兼容性处理
          // 在postcss.config.js 中
          // module.exports = {
          //   plugins: [
          //     //使用postcss插件
          //     require("postcss-preset-env"),
          //   ],
          // };
          // 帮postcss找到package.json中browserslist里面的配置，通过配置加载指定的css兼容性样式
          // "browserslist": {
          //   // 开发环境 --> 设置node环境变量：process.env.NODE_ENV = development
          //   "development": [
          //     "last 1 chrome version",
          //     "last 1 firefox version",
          //     "last 1 safari version"
          //   ],
          //   // 生产环境：默认是看生产环境
          //   "production": [
          //     ">0.2%",
          //     "not dead",
          //     "not op_mini all"
          //   ]
          // }
          'postcss-loader',
        ],
      },
      {
        test: /\.less$/i,
        use: [
          // compiles Less to CSSF
          'style-loader',
          'css-loader',
          // 将less文件编译成css文件
          // 需要下载 less-loader和less
          'less-loader',
        ],
      },
      {
        test: /\.(jpg|jpeg)$/i,
        type: 'asset/inline', // 替代url-loader
      },
      {
        test: /\.(png|jpg|gif)$/i,
        type: 'asset/resource', // 替代file-loader
      },
      {
        test: /\.(png|jpg|gif)$/i,
        type: 'asset',
        // parser: {
        //   dataUrlCondition: {
        //     // 图片大小小于10kb，就会被base64处理
        //     maxSize: 10 * 1024, // 10kb
        //   },
        // },
      },
      {
        test: /\.html$/i,
        // 处理html文件的img图片
        loader: 'html-withimg-loader',
        options: {
          esModule: false,
        },
      },
      /*
        js兼容性处理：babel-loader @babel/core
          1. 基本js兼容性处理 --> @babel/preset-env
            问题：只能转换基本语法，如promise高级语法不能转换
          2. 全部js兼容性处理 --> @babel/polyfill
            问题：我只要解决部分兼容性问题，但是将所有兼容性代码全部引入，体积太大了~
          3. 需要做兼容性处理的就做：按需加载  --> core-js
      */
      {
        test: /\.js$/i,
        exclude: /node_modules/,
        use: [
          // {
          //   loader: 'thread-loader',
          //   options: {
          //     workers: 2 // 进程2个
          //   }
          // },
          {
            loader: 'babel-loader',
            options: {
              // 自动修复eslint的错误
              presets: [
                [
                  '@babel/preset-env',
                  {
                    // 按需加载
                    useBuiltIns: 'usage',
                    // 指定core-js版本
                    corejs: {
                      version: 3,
                    },
                    // 指定兼容性做到哪个版本浏览器
                    targets: {
                      chrome: '60',
                      firefox: '60',
                      ie: '9',
                      safari: '10',
                      edge: '17',
                    },
                  },
                ],
              ],
              // 开启babel缓存
              // 第二次构建时，会读取之前的缓存
              cacheDirectory: true,
            },
          },
        ],
      },
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      }
    ],
  },
  plugins: [
    // webpack 的 output.path 目录中的所有文件将被删除一次，但目录本身不会
    // 如果使用 webpack 4+ 的默认配置，<PROJECT_DIR>/dist/ 下的所有内容都将被删除。
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      // 对输出的css文件进行重命名
      filename: 'css/boundle.css',
    }),
    new webpack.ProgressPlugin(),
    new ESLintPlugin({
      fix: true
    }),
  ].concat(htmlWebpackPlugins),
  stats: 'errors-only',
};