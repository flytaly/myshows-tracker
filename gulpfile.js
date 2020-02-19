const {
    src, dest, watch, series,
} = require('gulp');
const del = require('del');
const babel = require('gulp-babel');

const target = process.env.TARGET ? process.env.TARGET : 'firefox';

const outputPath = target === 'firefox' ? 'dist/firefox/' : 'dist/chrome/';

const paths = {
    input: 'src/',
    output: outputPath,
    scripts: {
        input: 'src/js/**/**.js',
        output: `${outputPath}js/`,
    },
    copy: {
        input: 'src/files/**/*',
        output: outputPath,
    },
    styles: {
        input: 'src/styles/**/*.css',
        output: `${outputPath}styles`,
    },
    target: {
        input: `src/${target}/**/*`,
        output: outputPath,
    },
};

const clean = (done) => {
    del.sync([`${paths.output}**`]);
    return done();
};

// Copy static files
const copyTargetFiles = () => src(paths.target.input)
    .pipe(dest(paths.target.output));
const copyCommonFiles = () => src(paths.copy.input)
    .pipe(dest(paths.copy.output));
const copyStyles = () => src(paths.styles.input)
    .pipe(dest(paths.styles.output));
const copyPolyfill = (done) => {
    if (target !== 'firefox') {
        return src('node_modules/webextension-polyfill/dist/browser-polyfill.js')
            .pipe(dest(paths.target.output));
    }
    return done();
};


const copyFiles = (done) => series(
    copyTargetFiles,
    copyCommonFiles,
    copyStyles,
    copyPolyfill,
)(done);

const processScripts = () => src(paths.scripts.input)
    .pipe(babel({
        presets: [[
            '@babel/preset-env',
            {
                targets: {
                    firefox: '69',
                },
                modules: 'false',
            },
        ]],
        plugins: [[
            'transform-define', {
                TARGET: target,
            }]],
    }))
    .pipe(dest(paths.scripts.output));

const watchFiles = (done) => {
    watch(paths.input, exports.default);
    done();
};

exports.build = series(
    clean,
    copyFiles,
    processScripts,
);

exports.default = series(processScripts, copyFiles);
exports.watch = series(
    exports.default,
    watchFiles,
);
