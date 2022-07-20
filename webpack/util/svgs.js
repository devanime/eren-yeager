const path = require('path');
const fs = require('fs');
const glob = require('glob');
module.exports = (config) => {
    const getPaths = match => {
        const paths = [];
        for (key in config.dependencies) {
            if (config.dependencies.hasOwnProperty(key) && config.dependencies[key].indexOf(match) > 0) {
                const dir = path.resolve(config.dependencies[key].split('file:').pop().trim());
                paths.push(dir);
            }
        }
        return paths;
    }
    const svgs = [];
    let paths = [
        path.resolve(config.theme.directory, 'assets/images')
    ];
    let files = [];
    for (match of ['dio-brando', 'plugins']) {
        paths = paths.concat(getPaths(match));
    }
    paths.push();
    for (dir of paths) {
        files = files.concat(glob.sync(path.resolve(dir, '**/svg-sprite/**/*.svg')));
    }
    const found = [];
    for (file of files) {
        const filename = path.basename(file);
        if (!found.includes(filename)) {
            found.push(filename);
            svgs.push(file);
        }
    }
    return svgs.reverse();
}
