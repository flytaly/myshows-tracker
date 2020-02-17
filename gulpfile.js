const {
    src, dest, watch, series,
} = require('gulp');
const del = require('del');
const babel = require('gulp-babel');

const target = process.env.TARGET || 'Firefox';

const paths = {
    input: 'src/',
    output: 'extension/',
    scripts: {
        input: 'src/js/**/**.js',
        output: 'extension/js/',
    },
    copy: {
        input: 'src/files/**/*',
        output: 'extension/',
    },
    styles: {
        input: 'src/styles/**/*.css',
        output: 'extension/styles',
    },
    firefox: {
        input: 'src/firefox/**/*',
        output: 'extension/',
    },
};

const clean = (done) => {
    del.sync([`${paths.output}**`]);
    return done();
};

// Copy static files
const copyTargetFiles = () => src(paths.firefox.input)
    .pipe(dest(paths.firefox.output));
const copyCommonFiles = () => src(paths.copy.input)
    .pipe(dest(paths.copy.output));
const copyStyles = () => src(paths.styles.input)
    .pipe(dest(paths.styles.output));

const copyFiles = (done) => series(
    copyTargetFiles,
    copyCommonFiles,
    copyStyles,
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
