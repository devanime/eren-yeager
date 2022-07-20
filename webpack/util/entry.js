const fs = require('fs');
module.exports = (themePath) => {
    const paths = {
        main: [`${themePath}/assets/scripts/main.js`, `${themePath}/assets/styles/main.scss`]
    };
    const admin = [`${themePath}/assets/scripts/admin.js`, `${themePath}/assets/styles/admin.scss`].filter(path => fs.existsSync(path));
    if (admin.length) {
        paths.admin = admin;
    }
    return paths;
}