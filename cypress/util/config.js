const path = require('path');
let config = {};

try {
    const webpackConfig = require('@devanime/webpack/util/config')();
    config.directory = `${webpackConfig.theme.directory}/tests`;
    config.baseUrl = `http://${webpackConfig.theme.localUrl}`
} catch {
}

try {
    const cypressConfig = require(path.resolve(`${config.directory}/cypress.json`));
    config = {...config, ...cypressConfig};
} catch {
}
module.exports = config;
