#!/usr/bin/env node

const { exec } = require("child_process");
const argv = require('minimist')(process.argv.slice(2));
const config = require('../util/config');
const local = require('../util/local');
if (argv['dry-run']) {
    exec('rm -f percy-sitemap.json');
    const sitemap = require('../util/sitemap');
    sitemap(config);
    // console.log(paths.join("\n"));
    // console.log(`---\n${paths.length} total pages`);
} else if (argv['local']) {
    local();
} else {
    const command = exec(`PERCY_TOKEN=${config.token} PERCY_BRANCH="${config.branch}" percy exec -- node node_modules/@devanime/percy`);
    command.stdout.pipe(process.stdout);
    command.stderr.on('data', function (data) {
        console.log('stderr: ' + data.toString());
    });
    command.on('exit', code => process.exit(code));
}
