/* eslint-disable no-unused-expressions,no-underscore-dangle */
import browser from 'webextension-polyfill';
import storage from '../storage.js';
import types from '../types.js';
import app from './app.js';
import setDefaultSettings from '../set-default-settings.js';
import { setBadgeAndTitle } from './helpers.js';
import { togglePopup } from './toggle-popup.js';
import state from './state.js';

async function update() {
    const { accessToken } = await storage.getAuthData();
    if (!accessToken) {
        togglePopup(true);
        return;
    }
    if (state.updating) return;
    state.updating = true;
    try {
        await app.updateData();
        state.lastUpdate = new Date();
        browser.alarms.create(types.ALARM_UPDATE, { delayInMinutes: 30 });
    } catch (e) {
        console.error(`${e.name}: ${e.message} \n ${e.stack}`);
        if (e.name === 'AuthError' && e.needAuth) {
            state.updating = false;
            togglePopup(true);
        }
        browser.alarms.create(types.ALARM_UPDATE, { delayInMinutes: 2 });
    }
    state.updating = false;
}

let isStarted = false;

const startExtension = async () => {
    if (isStarted) return;
    isStarted = true;

    const watchingShows = await storage.getWatchingShows();

    if (watchingShows) {
        setBadgeAndTitle(watchingShows);
    }

    await update();
};

startExtension();

browser.runtime.onInstalled.addListener(async () => {
    await setDefaultSettings();
});

browser.runtime.onStartup.addListener(async () => {
    startExtension();
});

browser.runtime.onConnect.addListener(async (port) => {
    console.log(`Connected with ${port.name}`);
    state.popupPort = port;

    port.onMessage.addListener(async (message) => {
        const { type, payload } = message;
        switch (type) {
            case types.SIGN_OUT:
                await browser.alarms.clearAll();
                await storage.clear();
                togglePopup(true);
                break;
            case types.RATE_EPISODE:
                await app.rateEpisode(payload.episodeId, payload.rating, payload.showId);
                break;
            case types.LOGIN: {
                try {
                    await app.login(payload.username, payload.password);
                    togglePopup();
                    await update();
                } catch (e) {
                    state.loginError = e;
                }
                break;
            }
            default:
        }
    });

    port.onDisconnect.addListener(() => {
        state.popupPort = null;
    });

    // force update if popup has been opened
    if (!state.updating) {
        const wasUpdated = (state.lastUpdate || 0) > Date.now() - 5000;
        return !wasUpdated ? update() : undefined;
    }
    // set state as true again so it send message to the popup
    state.updating = true;
});

browser.alarms.onAlarm.addListener(async ({ name }) => {
    if (name === types.ALARM_UPDATE) {
        await update();
    }
});
