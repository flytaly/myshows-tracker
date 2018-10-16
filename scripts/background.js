/* global browser, types, app, storage */

let popupPort;
const state = { updating: false };

async function update() {
    try {
        state.updating = true;
        await app.updateData();
        if (popupPort) popupPort.postMessage({ type: types.INFO_UPDATED });
        console.log(`Successfully updated at ${new Date()}`);
    } catch (e) {
        console.error(`${e.name}:${e.message}`);
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
    popupPort.onMessage.addListener(async (message) => {
        const { type } = message;
        switch (type) {
            default:
        }
    });
    popupPort.onDisconnect.addListener(() => { popupPort = null; });
    // force update if popup has been opened
    if (!state.updating) await update();
});
