/* eslint-disable no-unused-vars,no-unused-expressions,no-param-reassign */
/* global popupPort, types, browser */

/* Proxy object that sends messages to the popup upon changes */
const state = new Proxy({
    updating: false,
    lastUpdate: null,
    totalEpisodes: null,
    episodeWasRated: null,
    newRuTitlesRecieved: [],
}, ({
    set: (obj, prop, value) => {
        switch (prop) {
            case 'updating':
                popupPort && popupPort.postMessage({
                    type: value ? types.LOADING_START : types.LOADING_ENDED,
                });
                break;
            case 'lastUpdate':
                popupPort && popupPort.postMessage({ type: types.INFO_UPDATED });
                console.log(`Successfully updated at ${value}`);
                break;
            case 'totalEpisodes':
                browser.browserAction.setBadgeBackgroundColor({ color: '#252525' });
                browser.browserAction.setBadgeText({ text: value ? value.toString() : null });
                break;
            case 'episodeWasRated':
                popupPort && popupPort.postMessage({ type: types.EPISODE_WAS_RATED, payload: { episodeId: value } });
                break;
            case 'newRuTitlesRecieved':
                popupPort && popupPort.postMessage({ type: types.RU_TITLES_UPDATE, payload: { showIds: value } });
                break;
            default:
        }
        obj[prop] = value;
        return true;
    },
}));
