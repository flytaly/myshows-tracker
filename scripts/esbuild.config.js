import { build } from 'esbuild';
import { IS_DEV, log, getEnvKeys, TARGET } from './utils.js';

const outdir = './extension/dist';

build({
    entryPoints: [
        './src/js/background/background.js', //
        './src/js/popup/popup.js',
        './src/js/options/options.js',
        './src/js/popup-noauth.js',
    ],
    bundle: true,
    outdir,
    define: getEnvKeys(),
    watch: IS_DEV,
    format: 'esm',
})
    .then(() => {
        log(`esbuild`, `Built background and content scripts for ${TARGET}`);
        if (IS_DEV) {
            log('esbuild', `watch for changes`);
        }
    })
    .catch(() => process.exit(1));
