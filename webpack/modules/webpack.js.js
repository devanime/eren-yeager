module.exports = {
    externals: { jquery: 'jQuery' },
    resolve: {
        alias: {
            'vue$': 'vue/dist/vue.esm.js'
        },
        extensions: ['.js','.vue']
    },

    module: {
        rules: [
            {
                test: /\.m?js$/,
                exclude: /(node_modules\/(?!@devanime)|bower_components)/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-env']
                        }
                    },
                    'eslint-loader'
                ]
            }
        ]
    }
}