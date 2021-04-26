const path = require("path");
const webpack = require('webpack');
const HtmlWebpackPlugin = require("html-webpack-plugin");

console.log('----------');
console.log(__dirname);

console.log('----------');
module.exports = {
    entry: ['babel-polyfill', path.join(__dirname, "src/dapp")],
    output: {
        path: path.join(__dirname, "prod/dapp"),
        filename: "bundle.js"
    },
    module: {
        rules: [
            {
                test: /\.(js|ts)$/,
                enforce: 'pre',
                use: [
                    {
                        loader: "source-map-loader",
                        options: {}
                    },
                ],
            },
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                        plugins: ["@babel/plugin-proposal-class-properties"]
                    }
                }
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(png|svg|jpg|gif)$/,
                use: [
                    'file-loader'
                ]
            },
            {
                test: /\.html$/,
                use: "html-loader",
                exclude: /node_modules/
            }
        ]
    },
    ignoreWarnings: [/Failed to parse source map/, /Could not load content for/],
    plugins: [
        new HtmlWebpackPlugin({
            template: path.join(__dirname, "src/dapp/index.html")
        }),
        // fix "process is not defined" error:
        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer'],
        }),
        new webpack.SourceMapDevToolPlugin({
            filename: "[file].map"
        }),
    ],
    resolve: {
        extensions: [".js"],
        fallback: {
            assert: require.resolve("assert/"),
            crypto: require.resolve("crypto-browserify"),
            os: require.resolve("os-browserify/browser"),
            http: require.resolve("stream-http"),
            https: require.resolve("https-browserify"),
            stream: require.resolve("stream-browserify"),
        }
    },
    devServer: {
        contentBase: path.join(__dirname, "dapp"),
        port: 8000,
        stats: "minimal"
    },
};
