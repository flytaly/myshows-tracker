import pkg from '../package.json';
import { TARGET } from '../scripts/utils.js';

function browserSpecific() {
    const manifest = {};
    if (TARGET === 'chrome') {
        manifest.minimum_chrome_version = '105';
        manifest.key =
            'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzS/1DCNgzInyNUYNZcwDad5+SZPVAsiQaXfTC2k14b9CE3E2WWSROMK9BDesmKk5bOlrDyNlu0ZU5/kR8BBIKX1Hh6ZiXT2tZz+Q/YW3J2Tv6aqPYsOubzG2b2alcVjeO/HP30CDYMl5ia0GmGd4/nshWKrEH8/e8vYwlXM2dvsZEAZ0Rp2VliC5ycc8qoZXLk/MxFeC1jduqpfs5nkoe6TOsAU8svJerTUlpt1acU66xoRqOW+XsnHGlOb0zox9wY+PwSI2yCEJIXYh3OcOUqFCXmlGzJ+uVlFcnKvWFHViuO6r20Sb7aeEAB9kDSph/2iRIKQcDodGgPEKQV026wIDAQAB';
        manifest.background = {
            service_worker: './dist/background/background.js',
        };
    }
    if (TARGET === 'firefox') {
        manifest.browser_specific_settings = {
            gecko: {
                strict_min_version: '109.0',
                id: 'myshows@flytaly',
            },
        };
        manifest.background = {
            scripts: ['./dist/background/background.js'],
        };
    }
    return manifest;
}

const info = {
    default_locale: 'en',
    description: '__MSG_description__',
    name: '__MSG_name__',
    short_name: 'MyShows',
    version: pkg.version,
    homepage_url: 'https://github.com/flytaly/myshows-tracker',
};

export async function getManifest() {
    // update this file to update this manifest.json
    // can also be conditional based on your need
    return {
        manifest_version: 3,
        ...info,
        ...browserSpecific(),
        icons: {
            16: '/images/icon-16.png',
            32: '/images/icon-32.png',
            64: '/images/icon-64.png',
            128: '/images/icon-128.png',
            256: '/images/icon-256.png',
        },
        permissions: ['identity', 'storage', 'alarms'],
        host_permissions: ['https://*.myshows.me/*'],
        action: {
            default_title: '__MSG_extension_title__',
            default_icon: {
                32: '/images/icon-32.png',
                64: '/images/icon-64.png',
            },
            default_popup: 'popup.html',
        },
        options_ui: {
            page: 'options.html',
            open_in_tab: true,
        },
    };
}
