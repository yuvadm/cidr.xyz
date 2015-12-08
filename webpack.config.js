module.exports = {
    entry: './index.js',
    output: {
        path: __dirname,
        filename: 'bundle.js'
    },
    module: {
        loaders: [
            { test: /\.js$/, loader: 'babel' },
            { test: /\.css$/, loader: 'style!css' }
        ]
    }
};