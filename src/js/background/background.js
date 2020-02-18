/* eslint-disable no-unused-expressions,no-underscore-dangle */
import state from './state.js';
import storage from '../storage.js';
import types from '../types.js';
import app from './app.js';
import setDefaultSettings from '../set-default-settings.js';
import { setBadgeAndTitle } from './helpers.js';

async function update() {
    state.updating = true;
    try {
        await app.updateData();
        state.lastUpdate = new Date();
        browser.alarms.create(types.ALARM_UPDATE, { delayInMinutes: 30 });
    } catch (e) {
        console.error(`${e.name}: ${e.message} \n ${e.stack}`);
        if (e.name === 'AuthError' && e.needAuth) {
            await app.setAuth();
        }
        browser.alarms.create(types.ALARM_UPDATE, { delayInMinutes: 0.5 });
    }
    state.updating = false;
}

window.requestIdleCallback(async () => {
    const { accessToken } = await storage.getAuthData();

    if (!accessToken) {
        await app.setAuth();
    }

    const watchingShows = await storage.getWatchingShows();

    if (watchingShows) {
        setBadgeAndTitle(watchingShows);
    }

    await update();
});


browser.runtime.onInstalled.addListener(async () => {
    await setDefaultSettings();
});

browser.runtime.onConnect.addListener(async (port) => {
    state.popupPort = port;

    state.popupPort.onMessage.addListener(async (message) => {
        const { type, payload } = message;
        switch (type) {
            case types.SIGN_OUT:
                await browser.alarms.clearAll();
                await storage.clear();
                await app.setAuth();
                await update();
                break;
            case types.RATE_EPISODE:
                await app.rateEpisode(payload.episodeId, payload.rating, payload.showId);
                break;
            default:
        }
    });

    state.popupPort.onDisconnect.addListener(() => {
        state.popupPort = null;
    });
    // force update if popup has been opened
    if (!state.updating) await update();
});


browser.alarms.onAlarm.addListener(async ({ name }) => {
    if (name === types.ALARM_UPDATE) {
        await update();
    }
});
