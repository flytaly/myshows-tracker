import pkg from '../package.json';
import { TARGET } from '../scripts/utils.js';

function browserSpecific() {
    const manifest = {};
    if (TARGET === 'chrome') {
        manifest.minimum_chrome_version = '86';
        manifest.key =
            'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzS/1DCNgzInyNUYNZcwDad5+SZPVAsiQaXfTC2k14b9CE3E2WWSROMK9BDesmKk5bOlrDyNlu0ZU5/kR8BBIKX1Hh6ZiXT2tZz+Q/YW3J2Tv6aqPYsOubzG2b2alcVjeO/HP30CDYMl5ia0GmGd4/nshWKrEH8/e8vYwlXM2dvsZEAZ0Rp2VliC5ycc8qoZXLk/MxFeC1jduqpfs5nkoe6TOsAU8svJerTUlpt1acU66xoRqOW+XsnHGlOb0zox9wY+PwSI2yCEJIXYh3OcOUqFCXmlGzJ+uVlFcnKvWFHViuO6r20Sb7aeEAB9kDSph/2iRIKQcDodGgPEKQV026wIDAQAB';
    }
    if (TARGET === 'firefox') {
        manifest.applications = {
            gecko: {
                strict_min_version: '86.0',
                id: 'multitran@flytaly',
            },
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
        manifest_version: 2,
        ...info,
        ...browserSpecific(),
        background: {
            page: 'background.html',
        },
        icons: {
            48: '/images/icon-48.png',
            64: '/images/icon-64.png',
            96: '/images/icon-96.png',
            128: '/images/icon-128_padding.png',
        },
        permissions: ['identity', 'storage', 'alarms', 'https://*.myshows.me/*'],
        browser_action: {
            default_title: '__MSG_extension_title__',
            default_icon: {
                32: '/images/icon-32.png',
                64: '/images/icon-64.png',
                96: '/images/icon-96.png',
            },
            default_popup: 'popup.html',
        },
        options_ui: {
            page: 'options.html',
            open_in_tab: true,
        },
    };
}
