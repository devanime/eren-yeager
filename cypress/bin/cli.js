#!/usr/bin/env node

const { exec } = require('child_process');
const argv = require('minimist')(process.argv.slice(2));
const cypressConfig = require('../util/config');
let c;

if (argv['open']) {
    c = `cypress open --project ${cypressConfig.directory} --config baseUrl=${cypressConfig.baseUrl}`;
} else {
    let percyCommand = '';
    try {
        const percyConfig = require('@devanime/percy/util/config');
        percyCommand = `PERCY_TOKEN=${percyConfig.token} percy exec -- `;
    } catch (ex) {
    }
    const recordArgs = cypressConfig.recordKey ? `--record --key ${cypressConfig.recordKey}` : '';
    c = `${percyCommand} cypress run ${recordArgs} --project ${cypressConfig.directory} --config baseUrl=${cypressConfig.baseUrl}`
}

console.log(c);
const command = exec(c);
command.stdout.pipe(process.stdout);
command.on('exit', code => process.exit(code));


