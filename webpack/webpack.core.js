const ManifestPlugin = require('webpack-manifest-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const BrowserSyncPlugin = require('browser-sync-webpack-plugin');
const path = require('path');
const merge = require('webpack-merge');
const js = require('./modules/webpack.js');
const css = require('./modules/webpack.css');
const fonts = require('./modules/webpack.fonts');
const img = require('./modules/webpack.img');
const entry = require('./util/entry');
const config = require('./util/config')();

module.exports = (env, argv) => {
    const mode = process.env.NODE_ENV = env.NODE_ENV;
    const isProduction = mode === 'production';
    const themePath = config.theme.directory;
    const hash = config.theme.hash;
    const defaultBrowserSyncOptions = {
        host: 'localhost',
        server: false,
        files: ['{lib,templates}/**/*.php', '*.php'],
        proxy: config.theme.localUrl,
        snippetOptions: {
            whitelist: ['/wp-admin/admin-ajax.php'],
            blacklist: ['/wp-admin/**']
        }
    }
    const mergedBrowserSyncOptions = {...defaultBrowserSyncOptions, ...config.theme.browserSync}
    mergedBrowserSyncOptions.files = mergedBrowserSyncOptions.files.map((l) => `${themePath}/${l}`);
    const core = {
        mode,
        entry: entry(themePath),
        output: {
            path: `${themePath}/dist/`,
            filename: hash ? '[name].[contenthash].js' : '[name].js',
            publicPath: ''
        },
        devtool: isProduction ? 'source-map' : 'inline-source-map',
        stats: { children: false },
        module: {},
        plugins: [
            new CleanWebpackPlugin(),
            hash ? new ManifestPlugin({
                fileName: 'assets.json'
            }) : false,
            new BrowserSyncPlugin(mergedBrowserSyncOptions)
        ].filter(Boolean)
    };
    return merge(core, css(isProduction, config), js, fonts, img(config));
}
