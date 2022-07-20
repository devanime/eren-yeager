function objReset(obj) {
    const reset = {};
    for (let key of Object.keys(obj || {})) {
        reset[key] = 0;
    }
    return reset;
}

function getRegex(obj) {
    const regex = {};
    for (let key of Object.keys(obj || {})) {
        regex[key] = new RegExp(key.replace('/', '\/'));
    }
    return regex;
}

function prependSlash(arr) {
    return arr.map((item) => {
        return item.startsWith('/') ? item : `/${item}`;
    });
}

module.exports = (paths, filterRules, additionalPaths) => {
    const additional = prependSlash(additionalPaths || []);
    const counted = objReset(filterRules);
    const regex = getRegex(filterRules);
    const filteredList = paths.filter((path) => {
        let valid = true;
        for (const key of Object.keys(filterRules || {})) {
            if (regex[key].test(path)) {
                if (counted[key] >= filterRules[key]) {
                    valid = false;
                } else {
                    counted[key]++;
                }
            }
        }
        return valid;
    });
    return [...filteredList, ...(additional || [])].filter((value, index, self) => self.indexOf(value) === index).sort();
};