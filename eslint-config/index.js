module.exports = {
    "parserOptions": {
        "parser": "babel-eslint"
    },
    "env": {
        "browser": true
    },
    "extends": [
        "eslint-config-airbnb-base",
        "plugin:vue/strongly-recommended"
    ],
    "globals": {
        "jQuery": true,
        "Estarossa": true
    },
    "rules": {
        "import/no-extraneous-dependencies": 0,
        "no-prototype-builtins": 0,
        "indent": [
            "error",
            4,
            { "SwitchCase": 1 }
        ]
    }
}