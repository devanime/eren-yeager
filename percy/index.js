const PercyScript = require('@percy/script');
const scrollToBottom = require("scroll-to-bottomjs");
const config = require('./util/config');
const sitemap = require('./util/sitemap');
const viewports = require('./util/viewports');

sitemap(config).then((paths) => {
    const actions = config.actions || [];
    const snapshotOptions = config.hasOwnProperty('css') ? { percyCSS: config.css } : {};
    const cookies = (config.cookies || []).map((cookie) => {
        cookie.url = config.url;
        return cookie;
    });
    const globalActions = config.globalActions || [];
    const screens = viewports(config.viewports || ['mobile', 'desktop']);
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
    };
    PercyScript.run(async (page, percySnapshot) => {
        if (cookies) {
            // TODO: test cookies with age gate on stella
            await page.setCookie(...cookies);
        }
        for (let path of paths) {
            for (const [screen, viewport] of Object.entries(screens)) {
                await preparePage(page, path, viewport);
                const options = Object.assign({}, snapshotOptions, { widths: [viewport.width] });
                await percySnapshot(`${screen}:page  ${path}`, options);
            }
        }
        for (let action of actions) {
            let actionList = Array.isArray(action.click) ? action.click : [action.click];
            const actionScreens = action.hasOwnProperty('viewports') ? viewports(action.viewports) : screens;
            for (const [screen, viewport] of Object.entries(actionScreens)) {
                await preparePage(page, action.path, viewport);
                const options = Object.assign({}, snapshotOptions, { widths: [viewport.width] });
                for (let selector of actionList) {
                    try {
                        await page.click(selector);
                        await percySnapshot(`${screen}:click ${action.path} ${selector}`, options);
                    } catch (e) {
                        console.log(`Could not click ${selector} on ${action.path}`);
                    }
                }
            }
        }
    });
});
