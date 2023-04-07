import chokidar from 'chokidar';
import fs from 'fs-extra';
import { getManifest } from '../src/manifest.js';
import { IS_DEV, log, r } from './utils.js';

export async function writeManifest() {
    await fs.writeJSON(r('extension/manifest.json'), await getManifest(), { spaces: 2 });
    log('PRE', 'write manifest.json');
}

export async function copyCss() {
    await fs.copyFile(r('node_modules/modern-normalize/modern-normalize.css'), 'extension/styles/modern-normalize.css');
    log('PRE', 'copy normalize.css');
}

writeManifest();
copyCss();

if (IS_DEV) {
    chokidar.watch([r('src/manifest.js'), r('package.json')]).on('change', () => {
        writeManifest();
    });
}
