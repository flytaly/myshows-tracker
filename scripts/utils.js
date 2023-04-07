import { resolve } from 'path';
import { bgCyan, black } from 'kolorist';
import dotenv from 'dotenv';

export const IS_DEV = process.env.NODE_ENV === 'development';
export const TARGET = process.env.TARGET === 'firefox' ? 'firefox' : 'chrome';
export const PORT = parseInt(process.env.PORT || '', 10) || 3303;

/**
 * @param {string} name
 * @param {string} message
 */
export function log(name, message) {
    // eslint-disable-next-line no-console
    console.log(black(bgCyan(` ${name} `)), message);
}

/** @param  {...string} args */
export const r = (...args) => resolve(__dirname, '..', ...args);

export const getEnvKeys = () => {
    const envRaw = dotenv.config().parsed || {};
    envRaw.NODE_ENV = IS_DEV ? 'development' : 'production';
    envRaw.TARGET = TARGET;
    return Object.keys(envRaw).reduce(
        (envValues, envValue) => ({
            ...envValues,
            [`process.env.${envValue}`]: JSON.stringify(envRaw[envValue]),
        }),
        {},
    );
};
