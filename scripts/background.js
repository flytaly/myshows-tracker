/* global browser, types, app */

browser.runtime.onMessage.addListener((message) => {
    const { type } = message;
    switch (type) {
        case types.LOGIN:
            app.login();
            break;
        default:
    }
});
