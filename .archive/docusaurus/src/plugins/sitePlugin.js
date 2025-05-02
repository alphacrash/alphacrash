module.exports = async function webpackFix(context, options) {
  return {
    name: "custom-webpack-fix",
    configureWebpack(config, isServer) {
      return {
        resolve: {
          fallback: {
            fs: false,
            path: false,
            crypto: false,
            stream: false,
          },
        },
      };
    },
  };
};
