const path = require('path');
const crawler = require('./crawler');
const filter = require('./filter');
const fs = require('fs');
let sitemapCache = false;
try {
    sitemapCache = require(path.resolve('percy-sitemap.json'));
} catch (e) {
}

module.exports = async (config) => {
    if (sitemapCache) {
        return sitemapCache;
    }
    console.log(`Building sitemap for: ${config.url}`);
    const c = await crawler(config.url);
    const limit = config.limit || {};
    const paths = c.urls;

    const combinedPaths = filter(paths, config.limit || {}, config.include || []);
    fs.writeFile('percy-sitemap.json', JSON.stringify(combinedPaths), (err) => {
        if (err) {
            console.log(err);
        }
    });
};
