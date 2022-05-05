import browser from 'webextension-polyfill';
import { IS_CHROME } from '../constants.js';

if (IS_CHROME) {
    // chrome doesn't open links by default
    window.addEventListener('click', (e) => {
        const aElem = e.target.closest('a');
        if (aElem && aElem.href && !aElem.href.startsWith('chrome-extension')) {
            browser.tabs.create({ url: aElem.href });
        }
    });
}
