import * as esbuild from 'esbuild';
import { IS_DEV, log, getEnvKeys, TARGET } from './utils.js';

const outdir = './extension/dist';

async function run() {
    /** @type {esbuild.CommonOptions} */
    const options = {
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
    };

    if (IS_DEV) {
        const context = await esbuild.context(options);
        log('esbuild', `watch for changes`);
        await context.watch();
        return;
    }

    await esbuild.build(options);
    log(`esbuild`, `Built background and popup scripts for ${TARGET}`);
}

run();
