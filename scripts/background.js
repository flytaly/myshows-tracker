/* eslint-disable no-unused-expressions */
/* global browser, state, app, storage, types */

let popupPort;

async function update() {
    state.updating = true;
    try {
        await app.updateData();
        state.lastUpdate = new Date();
        browser.alarms.create(types.ALARM_UPDATE, { delayInMinutes: 30 });
    } catch (e) {
        console.error(`${e.name}: ${e.message}`);
        // TODO: if need auth call setAuth() instead of alarms
        browser.alarms.create(types.ALARM_UPDATE, { delayInMinutes: 0.5 });
    }
    state.updating = false;
}

window.requestIdleCallback(async () => {
    const { accessToken } = await storage.getAuthData();

    if (!accessToken) {
        await app.setAuth();
    }

    await update();
});

browser.runtime.onConnect.addListener(async (port) => {
    popupPort = port;
    popupPort.onDisconnect.addListener(() => {
        popupPort = null;
    });
    // force update if popup has been opened
    if (!state.updating) await update();
});


browser.alarms.onAlarm.addListener(async ({ name }) => {
    if (name === types.ALARM_UPDATE) {
        await update();
    }
});
