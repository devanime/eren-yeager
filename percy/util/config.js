const path = require('path');
const config = require(path.resolve('percy.config.json'));

config.url = config.url ? config.url.replace(/\/$/, '') : '';
module.exports = config;