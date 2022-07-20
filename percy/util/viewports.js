const viewports = {
    mobile: {
        "width": 375,
        "height": 667,
        "isMobile": true,
        "hasTouch": true
    },
    tablet: {
        "width": 768,
        "height": 1024,
        "hasTouch": true
    },
    desktop: {
        "width": 1280,
        "height": 900
    }
}
module.exports = (screens) => {
    return Object.keys(viewports)
        .filter(key => screens.includes(key))
        .reduce((obj, key) => {
            obj[key] = viewports[key];
            return obj;
        }, {});
}
