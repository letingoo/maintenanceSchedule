/**
 * Created by yzl on 2017/8/28.
 */
var webpack = require("webpack");
var path = require("path");
module.exports = {
    entry: __dirname+'/nodepublic/jslib.js',//入口文件
    output: {//输出文件
        path:__dirname+ "/public/",
        filename: './libtest.js'
    },
    plugins: [
        new webpack.ProvidePlugin({
            $:"jquery",
            jQuery:"jquery",
            "window.jQuery":"jquery"
        }),
    ],


    // module: {
    //     loaders: [//加载器
    //         {test: /\.html$/, loader: 'raw-loader'},
    //         {test: /\.css$/, loader: 'style-loader!css-loader'},
    //         {test: /\.scss$/, loader: 'style-loader!css-loader!sass-loader'},
    //         {test: /\.(png|jpg|ttf)$/, loader: 'url-loader?limit=8192'}
    //     ]
    // }
};
