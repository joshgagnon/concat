var webpack = require("webpack");
var path = require('path');
var DEV = process.env.NODE_ENV !== 'production';
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var CopyWebpackPlugin = require('copy-webpack-plugin');
var CleanWebpackPlugin = require('clean-webpack-plugin')
var  HtmlWebpackPlugin = require('html-webpack-plugin')
var autoprefixer = require('autoprefixer');

module.exports = {
    entry: {
        app: "./src/js/app.tsx",
    },
    cache: true,
    target: "web",
    output: {
        path:  path.resolve(__dirname, 'public'),
        //filename: DEV ? "[name].js" : "[name].[hash].js"
        filename: DEV ? "[name].js" : "[name].js"
    },
    debug: DEV,
    devtool: DEV ? "source-map" : null,
    module: {
        loaders: [
            { test: /\.tsx?$/, loader: "babel!ts-loader" },
             {
                test: /\.(scss|css)$/,
                loader: ExtractTextPlugin.extract(
                    // activate source maps via loader query
                    'css?-autoprefixer&sourceMap' +
                    '!postcss-loader?sourceMap' +
                    '!sass?sourceMap'
            )
            }, {
                test: /\.(png|jpg)$/,
                loader: 'url-loader?limit=8192&name=/images/[name].[ext]'
            }, {
                test: /\.json$/, loader: "json-loader"
            }, , {
                test: /\.(svg|woff|woff2|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,    loader: "file?name=[name].[ext]"
            },
        ],
        preLoaders: [
            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            { test: /\.js$/, loader: "source-map-loader" }
        ]
    },
    postcss: [autoprefixer({browsers: ['> 0.01%', 'ie 6-10']})],
    plugins: [
        new webpack.DefinePlugin({
            'process.env': {
                NODE_ENV: JSON.stringify(DEV ? 'development' : 'production')
            },
            DEV: DEV
        }),
        new CopyWebpackPlugin([
         { from: 'src/static', to: './' },
         ]),
        //new ExtractTextPlugin(DEV ? '[name].css' : '[name].[hash].css'),
        new ExtractTextPlugin(DEV ? '[name].css' : '[name].css'),
        new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /en-nz/),
        new webpack.optimize.DedupePlugin(),
        function() {
            if(!DEV){
                this.plugin("done", function(stats) {
                  require("fs").writeFileSync(
                    path.join(__dirname, "stats.json"),
                    JSON.stringify(stats.toJson().assetsByChunkName));
                });
            }
        },
        !DEV ? new CleanWebpackPlugin(['public'], {
          verbose: true,
          dry: false
        }) : function(){},

        !DEV ? new webpack.optimize.UglifyJsPlugin() : function(){},

        new HtmlWebpackPlugin({
            title: 'Working Days - CataLex®',
            hash: true,
            template: 'src/static/index.ejs',
            inject: 'body'
          })


    ]
}