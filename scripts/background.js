/* global browser, types, app */
browser.runtime.onMessage.addListener(async (message) => {
    const { type } = message;
    switch (type) {
        case types.LOGIN:
            await app.login();
            break;
        default:
    }
});
