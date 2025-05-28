const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const CopyPlugin = require('copy-webpack-plugin')

const finalPath = path.resolve(__dirname, 'dist')

module.exports = (env, argv) => {
    const isProduction = argv.mode === 'production'
    
    return {
        entry: './src/js/index.js',
        output: {
            path: finalPath,
            filename: 'app.js',
            clean: true,
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
                    type: 'asset/resource',
                    generator: {
                        filename: 'img/[name][ext]',
                    },
                },
                {
                    test: /\.(woff|woff2|ttf|otf|eot)$/,
                    type: 'asset/resource',
                    generator: {
                        filename: 'fonts/[name][ext]',
                    },
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
            new CopyPlugin({
                patterns: [
                    { from: './src/fonts', to: path.join(finalPath, '/fonts'), noErrorOnMissing: true },
                    { from: './src/img', to: path.join(finalPath, '/img'), noErrorOnMissing: true },
                    { from: './index.html', to: finalPath },
                    { from: './favicon.ico', to: finalPath },
                ],
            }),
            new MiniCssExtractPlugin({
                filename: 'app.css',
            }),
        ],
        devtool: isProduction ? false : 'source-map',
        devServer: {
            static: {
                directory: finalPath,
            },
            port: 3000,
            open: true,
        },
    }
}
