/* global browser, state */

let popupPort;

browser.runtime.onConnect.addListener(async (port) => {
    popupPort = port;
    popupPort.onDisconnect.addListener(() => {
        popupPort = null;
    });
    // force update if popup has been opened
    if (!state.updating) await update();
});
