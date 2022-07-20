const path = require('path');
const SVGSpritemapPlugin = require('svg-spritemap-webpack-plugin');
const ImageminWebpWebpackPlugin= require("imagemin-webp-webpack-plugin");
const svgs = require('../util/svgs');

module.exports = (config) => {
    const svgList = svgs(config);
    return {
        module: {
            rules: [
                {
                    test: /\.(jpe?g|png|gif|svg)$/,
                    use: [
                        {
                            loader: 'file-loader',
                            options: {
                                name(resourcePath) {
                                    const pathParts = resourcePath.split('images');
                                    return pathParts[1] || '[name].[ext]';
                                },
                                outputPath: 'images/',
                                publicPath: ''
                            }
                        },
                        'image-webpack-loader'
                    ]
                }
            ]
        },
        plugins: [
            new SVGSpritemapPlugin(svgList, {
                output: {
                    filename: 'images/sprite.svg',
                    svgo: {
                        plugins: [
                            {
                                inlineSVGElement: {
                                    type: 'full',
                                    fn(data) {
                                        const el = data.content[0];
                                        if (el.isElem('svg') && el.attrs.width === undefined && el.attrs.viewBox === undefined) {
                                            el.attrs.width = {name: 'width', value: '0'};
                                            el.attrs.height = {name: 'height', value: '0'};
                                            el.attrs.style = {name: 'style', value: 'position:absolute'};
                                        }
                                        return data;
                                    }
                                }
                            }
                        ]
                    }
                },
                sprite: {
                    prefix: false,
                    idify: filename => path.basename(filename, '.svg'),
                    generate: {
                        title: false,
                    }
                }
            }),
            new ImageminWebpWebpackPlugin({
                config: [{
                    test: /\.(jpe?g|png)/,
                    options: {
                        quality:  75
                    }
                }],
                overrideExtension: false,
                detailedLogs: false,
                silent: false,
                strict: true
            })
        ]
    }
}