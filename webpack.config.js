var bourbon = require('node-bourbon').includePaths

module.exports = {
    entry: './index.js',
    output: {
        path: __dirname,
        filename: 'bundle.js'
    },
    module: {
        loaders: [
            { test: /\.js$/, loader: 'babel' },
            { test: /\.scss$/, loader: 'style!css!sass?includePaths[]=' + bourbon }
        ]
    }
};
