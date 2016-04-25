var path = require('path');

module.exports = {
  entry: path.join(__dirname, "src", "react-pixi-exposeglobals.js"),

  output: {
    path: path.join(__dirname, "build"),
    publicPath: "/build/",
    filename: "react-pixi.js",
    libraryTarget: "var",
    library:"ReactPIXI"
  },

  module: {
    postLoaders:[
      {
        test: /\.js$/,
        loader: "transform/cacheable?brfs"
      }
    ],
    loaders: [
      {
	test: /\.js$/,
	loader: 'babel',
	include: path.join(__dirname, 'src'),
	query: {
          cacheDirectory: true,
          presets: ['es2015', 'stage-2'],
          plugins: ['transform-runtime']
	}
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      }
    ]
  },

  node: {
    fs: 'empty'
  }
}
