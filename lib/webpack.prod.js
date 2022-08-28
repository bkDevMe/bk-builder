
const { merge } = require('webpack-merge');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserWebpackPlugin = require('terser-webpack-plugin');
const baseConfig = require('./webpack.base');

const prodConfig = {
  mode: 'production',
  plugins: [
    new CssMinimizerPlugin(),
  ],
  optimization: {
    splitChunks: {
      chunks: 'all',
      // 默认值，可以不写~
      /* minSize: 30 * 1024, // 分割的chunk最小为30kb
      maxSiza: 0, // 最大没有限制
      minChunks: 1, // 要提取的chunk最少被引用1次
      maxAsyncRequests: 5, // 按需加载时并行加载的文件的最大数量
      maxInitialRequests: 3, // 入口js文件最大并行请求数量
      automaticNameDelimiter: '~', // 名称连接符
      name: true, // 可以使用命名规则
      cacheGroups: {
        // 分割chunk的组
        // node_modules文件会被打包到 vendors 组的chunk中。--> vendors~xxx.js
        // 满足上面的公共规则，如：大小超过30kb，至少被引用一次。
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          // 优先级
          priority: -10
        },
        default: {
          // 要提取的chunk最少被引用2次
          minChunks: 2,
          // 优先级
          priority: -20,
          // 如果当前要打包的模块，和之前已经被提取的模块是同一个，就会复用，而不是重新打包模块
          reuseExistingChunk: true
        }
      } */
    },
    // 将当前模块的记录其他模块的hash单独打包为一个文件 runtime
    // 解决：修改a文件导致b文件的contenthash变化
    runtimeChunk: {
      name: (entrypoint) => `runtime-${entrypoint.name}`,
    },
    minimize: true,
    minimizer: [
      // 配置生产环境的压缩方案：js和css
      new TerserWebpackPlugin({
        // 开启多进程打包
        parallel: true,
      }),
      `...`,
      new CssMinimizerPlugin(),
    ],
  },
  performance: {
    // 入口起点的最大体积，这个参数代表入口加载时候最大体积，将其改为了1M，
    maxEntrypointSize: 1000000,
    // 此选项根据单个资源体积，控制 webpack 何时生成性能提示，自己将其改成了1M
    maxAssetSize: 1000000,
    // 属性允许 webpack 控制用于计算性能提示的文件，通过覆盖原有属性，将其改成只对js文件进行性能测试。
    assetFilter(assetFilename) {
      return assetFilename.endsWith('.js');
    },
  },
};

module.exports = merge(baseConfig, prodConfig);
