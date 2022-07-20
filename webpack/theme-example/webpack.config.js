/* Use default config */
module.exports = require('@devanime/webpack');

/* OR, merge default config with theme-specific config */
/*
const devanime = require('@devanime/webpack');
const merge = require('webpack-merge');
const config = require('@devanime/webpack/util/config')();
module.exports = (env, argv) => {
    const isProduction = env.NODE_ENV === 'production';
    const themePath = config.theme.directory;
    return merge(devanime(env, argv), {
        // additional webpack config
    });
};
*/
