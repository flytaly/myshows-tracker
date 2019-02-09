const path = require('path');

module.exports = {
    entry: {
        scripts: './scripts/background.js',
        popup: './popup/popup.js',
        options: './options/options.js',
    },
    output: {
        path: path.resolve(__dirname, 'extension'),
        filename: '[name]/bundle.js',
    },
    mode: 'none',
    watchOptions: {
        ignored: ['node_modules'],
    },
};
