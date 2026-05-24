const { defineConfig } = require("@vue/cli-service");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");

module.exports = defineConfig({
  transpileDependencies: true,
  productionSourceMap: false,
  devServer: {
    proxy: {
      "/api": {
        target: "http://localhost:8102",
        changeOrigin: true,
      },
    },
  },
  configureWebpack: {
    optimization: {
      splitChunks: {
        chunks: "all",
        maxInitialRequests: 5,
        cacheGroups: {
          vendor: {
            name: "chunk-vendors",
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            chunks: "initial",
          },
          common: {
            name: "chunk-common",
            minChunks: 2,
            priority: 5,
            chunks: "initial",
            reuseExistingChunk: true,
          },
        },
      },
    },
    plugins: [
      new MonacoWebpackPlugin({
        languages: ["java", "javascript", "typescript", "python", "cpp"],
        features: ["coreCommands", "find"],
      }),
    ],
  },
  chainWebpack(config) {
    config.plugins.delete("prefetch");
    config.plugins.delete("preload");

    // 配置 gzip 压缩
    config
      .plugin("CompressionPlugin")
      .use(require("compression-webpack-plugin"), [
        {
          algorithm: "gzip",
          test: /\.(js|css|html|svg)$/,
          threshold: 8192,
          minRatio: 0.8,
        },
      ]);

    // 配置图片压缩
    config.module
      .rule("images")
      .use("image-webpack-loader")
      .loader("image-webpack-loader")
      .options({
        mozjpeg: {
          progressive: true,
          quality: 65,
        },
        optipng: {
          enabled: true,
        },
        pngquant: {
          quality: [0.65, 0.9],
          speed: 4,
        },
        gifsicle: {
          interlaced: false,
        },
      })
      .end();
  },
  pages: {
    index: {
      entry: "src/main.ts",
      title: "MyOJ",
    },
  },
});
