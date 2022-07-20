const puppeteer = require('puppeteer');
const mkdirp = require('mkdirp');
const scrollToBottom = require("scroll-to-bottomjs");
const del = require('del');
const config = require('./config');
const sitemap = require('./sitemap');
const viewports = require('./viewports');
const globalActions = config.globalActions || [];

async function preparePage(page, path, viewport) {
    await page.setViewport(viewport);
    const response = await page.goto(config.url + path);
    try {
        const encoded = (await response.buffer()).toString('utf8');
        await page.setContent(encoded);
    } catch (e) {
    }
    for (let action of globalActions) {
        let actionList = Array.isArray(action) ? action : [action];
        for (let selector of actionList) {
            try {
                await page.click(selector);
            } catch (e) {
            }
        }
    }
    await page.evaluate(scrollToBottom, { frequency: 150, timing: 30 });
    await page.waitForTimeout(4000);
}

module.exports = async () => {
    const screenshotPath = 'screenshots/' + config.branch;
    try {
        await del(screenshotPath);
    } catch (e) {
        console.log(e);
    }
    mkdirp.sync(screenshotPath);
    const paths = await sitemap(config);
    const browser = await puppeteer.launch({
        headless: true
    });

    const page = await browser.newPage();
    const actions = config.actions || [];
    const cookies = (config.cookies || []).map((cookie) => {
        cookie.url = config.url;
        return cookie;
    });

    const screens = viewports(config.viewports || ['mobile', 'desktop']);

    if (cookies) {
        await page.setCookie(...cookies);
    }
    for (let path of paths) {
        for (const [screen, viewport] of Object.entries(screens)) {
            try {
                await preparePage(page, path, viewport);
                await page.screenshot({
                    path: screenshotPath + '/' + screen + '__' + path.replace(/\//gi, '_') + '.png',
                    fullPage: true
                });
            } catch (e) {
                console.log(e);
            }
        }
    }
    for (let action of actions) {
        let actionList = Array.isArray(action.click) ? action.click : [action.click];
        const actionScreens = action.hasOwnProperty('viewports') ? viewports(action.viewports) : screens;
        for (const [screen, viewport] of Object.entries(actionScreens)) {
            await preparePage(page, action.path, viewport);
            for (let selector of actionList) {
                try {
                    await page.click(selector);
                    await page.screenshot({
                        path: screenshotPath + '/' + screen + '_click__' + action.path.replace(/\//gi, '_') + '_' + selector + '.png',
                        fullPage: true
                    });
                } catch (e) {
                    console.log(`Could not click ${selector} on ${action.path}`);
                }
            }
        }
    }
    await browser.close();
}
