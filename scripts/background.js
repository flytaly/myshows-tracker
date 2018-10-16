/* eslint-disable no-unused-expressions */
/* global state, app, storage */

async function update() {
    state.updating = true;
    try {
        await app.updateData();
        state.lastUpdate = new Date();
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

