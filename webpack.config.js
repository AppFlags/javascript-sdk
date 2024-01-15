const path = require('path');

module.exports = {
    mode: `production`,
    entry: './src/index.ts',
    output: {
        path: path.resolve(__dirname, 'bundle'),
        filename: 'appflags.js',
        libraryTarget: 'umd',
        library: 'AppFlags',
        libraryExport: 'default',
        umdNamedDefine: true
    },
    resolve: {
        extensions: [ '.tsx', '.ts', '.js' ],
    },
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },


};
