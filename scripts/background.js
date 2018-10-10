/* global browser, types, app, storage */

browser.runtime.onMessage.addListener(async (message) => {
    const { type } = message;
    switch (type) {
        case types.LOGIN:
            await app.login();
            break;
        default:
    }
});

window.requestIdleCallback(async () => {
    const { accessToken } = await storage.getAuthData();

    if (!accessToken) {
        app.setAuth();
        return;
    }

    try {
        if (await app.updateData()) {
            console.log(`Successfully updated at ${new Date()}`);
        }
    } catch (e) {
        console.error(`${e.name} occurred during updating: ${e.message}`);
    }
});
