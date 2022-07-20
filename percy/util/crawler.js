const axios = require('axios');
const cheerio = require('cheerio');

function trimAny(str, chars) {
    var start = 0,
        end = str.length;

    while (start < end && chars.indexOf(str[start]) >= 0)
        ++start;

    while (end > start && chars.indexOf(str[end - 1]) >= 0)
        --end;

    return (start > 0 || end < str.length) ? str.substring(start, end) : str;
}

module.exports = async function (url) {
    const base = (new URL(url));
    const parsed = [];
    const found = [
        trimAny(base.href, '/')
    ];
    const failed = [];
    while (found.length) {
        const url = found.shift();
        parsed.push(url);
        console.log('found: ' + url);
        let response = false;
        try {
            response = await axios.get(url);
        } catch (e) {
            failed.push(url);
            continue;
        }
        if (!response) {
            continue;
        }
        const $ = cheerio.load(response.data);
        $('a').each((index, el) => {
            const $el = $(el);
            let urlObj = false;
            try {
                urlObj = new URL($el.attr('href'), base);
            } catch(e){
                console.error('Link broken: href="' + $el.attr('href') + '" on ' + url);
                return;
            }
            
            const href = trimAny((new URL(urlObj.origin + urlObj.pathname, base)).href, '/');
            if(['.pdf', '.mp4', 'jpg', '.jpeg', '.svg', '.png', '.zip', '.gif', '.bmp', '.mp3'].some((ext) => href.includes(ext))) {
                return;
            }
            if (urlObj.origin === base.origin && !parsed.includes(href) && !found.includes(href)) {
                found.push(href);
            }
        });
    }
    parsed.sort();
    parsed.sort((a, b) => {
        return a.split('/').length - b.split('/').length;
    })
    return {
        urls: parsed.map((url) => {
            return url.replace(base.origin, '') || '/';
        }), failed: failed
    }
};