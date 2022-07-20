module.exports = {
    module: {
        rules: [{

            test: /\.(woff(2)?|ttf|eot|otf)$/,
            use: {
                loader: 'file-loader',
                options: {
                    name(resourcePath) {
                        const pathParts = resourcePath.split('fonts');
                        return pathParts[1] || '[name].[ext]';
                    },
                    outputPath: 'fonts/',
                    publicPath: ''
                }
            }
        }]
    }
}