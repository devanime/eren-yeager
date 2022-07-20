const path = require('path');
const config = require(path.resolve('package.json'));
module.exports = () => {
    config.theme.directory = path.resolve(config.theme.directory);
    config.theme.hash = config.theme.hash !== false;
    config.theme.browserSync = config.theme.browserSync || {};
    config.hasVue = config.dependencies.hasOwnProperty('vue');
    return config;
}