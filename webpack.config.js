const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CopyPlugin = require('copy-webpack-plugin')

const finalPath = path.resolve(__dirname, 'dist')
const isProduction = process.env.NODE_ENV === 'production'

module.exports = {
    mode: isProduction ? 'production' : 'development',
    entry: './src/js/index.js',
    output: {
        path: finalPath,
        filename: 'app.js'
    },
    resolve: {
        alias: {
            img: path.resolve(__dirname, 'src/img'),
            js: path.resolve(__dirname, 'src/js'),
            font: path.resolve(__dirname, 'src/fonts'),
        },
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                    },
                },
            },
            {
                test: /\.scss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'sass-loader',
                ],
            },
            {
                test: /\.(png|jpe?g|gif|svg)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]',
                            outputPath: 'img',
                        },
                    },
                ],
            },
            {
                test: /\.(woff|woff2|ttf|otf|eot)$/,
                use: [
                    {
                        loader: 'file-loader',
                        options: {
                            name: '[name].[ext]',
                            outputPath: 'fonts',
                        },
                    },
                ],
            },
            {
                test: /\.(glsl|vs|fs|vert|frag)$/,
                exclude: /node_modules/,
                use: [
                    'raw-loader',
                    'glslify-loader',
                ],
            },
        ],
    },
    plugins: [
        new CopyPlugin([
            { from: './src/img', to: path.join(finalPath, '/img'), force: true },
        ]),
        new MiniCssExtractPlugin({
            filename: 'app.css',
        }),
        // Only add BrowserSync in development
        ...(isProduction ? [] : [
            new (require('browser-sync-webpack-plugin'))({
                host: 'localhost',
                port: 3000,
                server: { baseDir: '.' },
            })
        ])
    ],
}
