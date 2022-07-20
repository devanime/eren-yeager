const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const globImporter = require('node-sass-glob-importer');

module.exports = (isProduction, config) => {
    const includeVue = config.hasVue;
    const themePath = config.theme.directory;
    const hash = config.theme.hash;
    return {
        module: {
            rules: [
                includeVue ? {
                    test: /\.vue$/,
                    loader: 'vue-loader'
                } : false,
                {
                    test: /\.s(c|a)ss$/,
                    use: [
                        includeVue ? 'vue-style-loader' : false,
                        {
                            loader: MiniCssExtractPlugin.loader,
                            options: {
                                publicPath: ''
                            }
                        },
                        {
                            loader: 'css-loader',
                            options: {
                                importLoaders: 1,
                                url: false
                            },
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                ident: 'postcss',
                                plugins: (loader) => [
                                    require('postcss-preset-env')({
                                        browsers: 'last 2 versions',
                                    })
                                ].concat(isProduction ? [
                                    require('cssnano')({
                                        preset: ['default', {
                                            mergeLonghand: false,
                                        }]
                                    })
                                ] : [])
                            },
                        },
                        {
                            loader: 'sass-loader',
                            options: {
                                prependData: ({resourcePath}) => {
                                    const lineEnding = resourcePath.endsWith('.sass') ? '' : ';';
                                    return `@import "${path.resolve(themePath, 'assets/styles/common/_variables.scss')}"` + lineEnding;
                                },
                                implementation: require('sass'),
                                sassOptions: {
                                    fiber: require('fibers'),
                                    importer: globImporter()
                                }
                            },
                        }
                    ].filter(Boolean),
                }
            ].filter(Boolean)
        },
        plugins: [
            new MiniCssExtractPlugin({
                filename: hash ? '[name].[contenthash].css' : '[name].css',
                chunkFilename: '[id].css'
            }),
            includeVue ? new VueLoaderPlugin() : false,
        ].filter(Boolean)
    }
}
