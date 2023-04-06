import * as esbuild from 'esbuild';
import { IS_DEV, log, getEnvKeys, TARGET } from './utils.js';

const outdir = './extension/dist';

async function run() {
    const context = await esbuild.context({
        entryPoints: [
            './src/js/background/background.js', //
            './src/js/popup/popup.js',
            './src/js/options/options.js',
            './src/js/popup-noauth.js',
        ],
        bundle: true,
        outdir,
        define: getEnvKeys(),
        format: 'esm',
    });

    log(`esbuild`, `Built background and content scripts for ${TARGET}`);
    if (IS_DEV) {
        log('esbuild', `watch for changes`);
        await context.watch();
    }
}

run();
